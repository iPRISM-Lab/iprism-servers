import { createClient } from 'npm:@supabase/supabase-js@2.103.3';
import { normalizeProfile, renderCvHtml } from '../_shared/cv-template.js';

const GITHUB_API_VERSION = '2026-03-10';
const PHOTO_BUCKET = 'cv-photos';
const encoder = new TextEncoder();

type CvRecord = {
    id: string;
    user_id: string;
    slug: string;
    content: Record<string, unknown>;
    github_repository: string | null;
    published_url: string | null;
};

Deno.serve(async (request) => {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubOrg = Deno.env.get('GITHUB_ORG');
    const baseDomain = Deno.env.get('CV_BASE_DOMAIN')?.toLowerCase();
    const cloudflareToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const cloudflareZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    const missing = Object.entries({
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SECRET_KEY: supabaseSecret,
        GITHUB_TOKEN: githubToken,
        GITHUB_ORG: githubOrg,
        CV_BASE_DOMAIN: baseDomain,
        CLOUDFLARE_API_TOKEN: cloudflareToken,
        CLOUDFLARE_ZONE_ID: cloudflareZoneId
    }).filter(([, value]) => !value).map(([key]) => key);

    if (missing.length) {
        console.error(`Publisher configuration is missing: ${missing.join(', ')}`);
        return json({ error: 'Publisher configuration is incomplete' }, 503, corsHeaders);
    }
    if (!isDomain(baseDomain!)) return json({ error: 'CV_BASE_DOMAIN is invalid' }, 503, corsHeaders);

    const authorization = request.headers.get('Authorization') || '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');
    if (!accessToken) return json({ error: 'Authentication required' }, 401, corsHeaders);

    const admin = createClient(supabaseUrl!, supabaseSecret!, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    let userId = '';

    try {
        const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
        if (authError || !authData.user) return json({ error: 'Invalid session' }, 401, corsHeaders);
        await verifyGithubOrganizationMembership(authData.user.identities || [], githubOrg!, githubToken!);
        userId = authData.user.id;

        const body = await request.json().catch(() => ({}));
        const { data, error } = await admin
            .from('cv_profiles')
            .select('id, user_id, slug, content, github_repository, published_url')
            .eq('user_id', userId)
            .single();
        if (error || !data) throw new Error('Save your CV draft before publishing');

        const record = data as CvRecord;
        if (body.expectedSlug && body.expectedSlug !== record.slug) throw new Error('The saved subdomain changed. Save and publish again.');
        if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(record.slug)) throw new Error('The saved subdomain is invalid');

        const profile = normalizeProfile({ ...record.content, slug: record.slug });
        if (!String(profile.personal.name || '').trim()) throw new Error('Full name is required before publishing');
        if (encoder.encode(JSON.stringify(profile)).byteLength > 500_000) throw new Error('The CV draft is too large to publish');
        if (profile.publications.length > 500) throw new Error('A maximum of 500 publications can be published');

        await admin.from('cv_profiles').update({ publication_status: 'publishing', updated_at: new Date().toISOString() }).eq('user_id', userId);

        const hostname = `${record.slug}.${baseDomain}`;
        const oldHostname = getPublishedHostname(record.published_url, baseDomain!);
        const repositoryName = resolveRepositoryName(record.github_repository, githubOrg!, record.slug);
        const repository = await ensureRepository(githubOrg!, repositoryName, githubToken!);
        const branch = repository.default_branch || 'main';

        const marker = await getRepositoryContent(githubOrg!, repositoryName, '.iprism-cv.json', githubToken!, branch);
        if (!repository.created && (!marker || !isManagedMarker(marker.content, record.id))) {
            throw new Error(`Repository ${githubOrg}/${repositoryName} exists but is not managed by the CV publisher`);
        }

        let publishedPhotoPath = '';
        let publishedPhoto: Uint8Array | null = null;
        const photoPath = String(profile.personal.photoPath || '');
        if (photoPath) {
            if (!photoPath.startsWith(`${userId}/`)) throw new Error('The profile photo path is invalid');
            const { data: photoBlob, error: photoError } = await admin.storage.from(PHOTO_BUCKET).download(photoPath);
            if (photoError || !photoBlob) throw new Error('The profile photo could not be prepared for publishing');
            const extension = photoPath.split('.').pop()?.toLowerCase();
            if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) throw new Error('The profile photo type is unsupported');
            publishedPhotoPath = `profile.${extension === 'jpeg' ? 'jpg' : extension}`;
            publishedPhoto = new Uint8Array(await photoBlob.arrayBuffer());
        }

        const indexHtml = renderCvHtml(profile, {
            photoUrl: publishedPhotoPath ? `./${publishedPhotoPath}` : ''
        });
        const markerContent = JSON.stringify({ generator: 'iprism-cv', profileId: record.id, version: 1 }, null, 2);

        await putRepositoryContent(githubOrg!, repositoryName, 'index.html', encoder.encode(indexHtml), 'Publish CV', githubToken!, branch);
        await putRepositoryContent(githubOrg!, repositoryName, '.nojekyll', new Uint8Array(), 'Configure static publishing', githubToken!, branch);
        await putRepositoryContent(githubOrg!, repositoryName, 'CNAME', encoder.encode(hostname), 'Configure CV domain', githubToken!, branch);
        await putRepositoryContent(githubOrg!, repositoryName, '.iprism-cv.json', encoder.encode(markerContent), 'Record CV publisher ownership', githubToken!, branch);
        if (publishedPhoto && publishedPhotoPath) {
            await putRepositoryContent(githubOrg!, repositoryName, publishedPhotoPath, publishedPhoto, 'Publish profile photo', githubToken!, branch);
        }

        await configurePages(githubOrg!, repositoryName, branch, hostname, githubToken!);
        await upsertCloudflareRecord(hostname, `${githubOrg}.github.io`, cloudflareZoneId!, cloudflareToken!);
        if (oldHostname && oldHostname !== hostname) {
            await deleteCloudflareRecord(oldHostname, cloudflareZoneId!, cloudflareToken!);
        }

        const httpsEnforced = await tryEnforceHttps(githubOrg!, repositoryName, hostname, githubToken!);
        const publishedUrl = `https://${hostname}/`;
        const now = new Date().toISOString();
        const { error: updateError } = await admin.from('cv_profiles').update({
            publication_status: 'published',
            published_url: publishedUrl,
            github_repository: `${githubOrg}/${repositoryName}`,
            last_published_at: now,
            updated_at: now
        }).eq('user_id', userId);
        if (updateError) throw new Error('The site was published, but its status could not be saved');

        return json({
            status: 'published',
            url: publishedUrl,
            repository: `${githubOrg}/${repositoryName}`,
            httpsPending: !httpsEnforced
        }, 200, corsHeaders);
    } catch (error) {
        console.error('CV publication failed:', error);
        if (userId) {
            await admin.from('cv_profiles').update({
                publication_status: 'failed',
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
        }
        const message = error instanceof Error ? error.message : 'CV publication failed';
        return json({ error: message }, 400, corsHeaders);
    }
});

async function ensureRepository(owner: string, repository: string, token: string) {
    const existing = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, token, {}, [404]);
    if (existing.response.status !== 404) return { ...existing.data, created: false };

    const created = await githubRequest(`/orgs/${encodeURIComponent(owner)}/repos`, token, {
        method: 'POST',
        body: JSON.stringify({
            name: repository,
            description: 'Public academic CV generated by iPRISM Hub',
            private: false,
            auto_init: true,
            has_issues: false,
            has_projects: false,
            has_wiki: false
        })
    });
    return { ...created.data, created: true };
}

async function verifyGithubOrganizationMembership(identities: unknown[], owner: string, token: string) {
    const identity = identities.find((item): item is Record<string, unknown> => (
        Boolean(item) && typeof item === 'object' && (item as Record<string, unknown>).provider === 'github'
    ));
    const identityData = identity?.identity_data as Record<string, unknown> | undefined;
    const providerId = String(identity?.provider_id || identityData?.provider_id || identityData?.sub || '');
    if (!/^\d+$/.test(providerId)) throw new Error('A linked GitHub identity is required to publish');

    const account = await githubRequest(`/user/${providerId}`, token);
    const login = account.data?.login;
    if (!login) throw new Error('The linked GitHub identity could not be verified');

    const membership = await githubRequest(
        `/orgs/${encodeURIComponent(owner)}/memberships/${encodeURIComponent(login)}`,
        token,
        {},
        [404]
    );
    if (membership.response.status === 404 || membership.data?.state !== 'active') {
        throw new Error(`Active ${owner} organization membership is required to publish`);
    }
}

async function getRepositoryContent(owner: string, repository: string, path: string, token: string, branch: string) {
    const result = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
        token,
        {},
        [404]
    );
    if (result.response.status === 404) return null;
    return result.data;
}

async function putRepositoryContent(owner: string, repository: string, path: string, content: Uint8Array, message: string, token: string, branch: string) {
    const existing = await getRepositoryContent(owner, repository, path, token, branch);
    const body: Record<string, unknown> = {
        message,
        content: toBase64(content),
        branch
    };
    if (existing?.sha) body.sha = existing.sha;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodePath(path)}`, token, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            return;
        } catch (error) {
            if (attempt === 2) throw error;
            await delay(450 * (attempt + 1));
        }
    }
}

async function configurePages(owner: string, repository: string, branch: string, hostname: string, token: string) {
    const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pages`;
    const current = await githubRequest(path, token, {}, [404]);
    if (current.response.status === 404) {
        await githubRequest(path, token, {
            method: 'POST',
            body: JSON.stringify({ source: { branch, path: '/' } })
        });
    }

    await githubRequest(path, token, {
        method: 'PUT',
        body: JSON.stringify({ cname: hostname, source: { branch, path: '/' } })
    });
}

async function tryEnforceHttps(owner: string, repository: string, hostname: string, token: string) {
    try {
        await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pages`, token, {
            method: 'PUT',
            body: JSON.stringify({ cname: hostname, https_enforced: true })
        });
        return true;
    } catch (error) {
        console.warn('HTTPS is pending certificate provisioning:', error);
        return false;
    }
}

async function upsertCloudflareRecord(hostname: string, target: string, zoneId: string, token: string) {
    const existing = await cloudflareRequest(`/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`, token);
    const record = existing.result?.[0];
    const body = JSON.stringify({
        type: 'CNAME',
        name: hostname,
        content: target,
        ttl: 1,
        proxied: false,
        comment: 'Managed by iPRISM CV publisher'
    });
    if (record) {
        await cloudflareRequest(`/zones/${zoneId}/dns_records/${record.id}`, token, { method: 'PUT', body });
    } else {
        await cloudflareRequest(`/zones/${zoneId}/dns_records`, token, { method: 'POST', body });
    }
}

async function deleteCloudflareRecord(hostname: string, zoneId: string, token: string) {
    const existing = await cloudflareRequest(`/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(hostname)}`, token);
    for (const record of existing.result || []) {
        await cloudflareRequest(`/zones/${zoneId}/dns_records/${record.id}`, token, { method: 'DELETE' });
    }
}

async function githubRequest(path: string, token: string, init: RequestInit = {}, allowedStatuses: number[] = []) {
    const response = await fetch(`https://api.github.com${path}`, {
        ...init,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': GITHUB_API_VERSION,
            ...(init.headers || {})
        }
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok && !allowedStatuses.includes(response.status)) {
        throw new Error(`GitHub API ${response.status}: ${data?.message || 'request failed'}`);
    }
    return { response, data };
}

async function cloudflareRequest(path: string, token: string, init: RequestInit = {}) {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init.headers || {})
        }
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
        const message = data?.errors?.map((entry: { message?: string }) => entry.message).filter(Boolean).join(', ');
        throw new Error(`Cloudflare API ${response.status}: ${message || 'request failed'}`);
    }
    return data;
}

function isManagedMarker(encodedContent: string, profileId: string) {
    try {
        const marker = JSON.parse(new TextDecoder().decode(fromBase64(encodedContent.replace(/\s/g, ''))));
        return marker.generator === 'iprism-cv' && marker.profileId === profileId;
    } catch {
        return false;
    }
}

function resolveRepositoryName(savedRepository: string | null, owner: string, slug: string) {
    if (!savedRepository) return `cv-${slug}`;
    const [savedOwner, repository, ...extra] = savedRepository.split('/');
    if (extra.length || savedOwner.toLowerCase() !== owner.toLowerCase() || !/^cv-[a-z0-9-]+$/.test(repository || '')) {
        throw new Error('The saved GitHub repository is invalid');
    }
    return repository;
}

function getPublishedHostname(value: string | null, baseDomain: string) {
    if (!value) return '';
    try {
        const hostname = new URL(value).hostname.toLowerCase();
        return hostname.endsWith(`.${baseDomain}`) ? hostname : '';
    } catch {
        return '';
    }
}

function isDomain(value: string) {
    return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);
}

function encodePath(path: string) {
    return path.split('/').map(encodeURIComponent).join('/');
}

function toBase64(bytes: Uint8Array) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
}

function fromBase64(value: string) {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getCorsHeaders(request: Request) {
    const origin = request.headers.get('Origin') || '*';
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((value) => value.trim()).filter(Boolean);
    const allowedOrigin = !allowed.length || allowed.includes('*') || allowed.includes(origin) ? origin : allowed[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        Vary: 'Origin'
    };
}

function json(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' }
    });
}

function delay(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
