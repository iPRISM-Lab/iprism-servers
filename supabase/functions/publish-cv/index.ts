import { createClient } from 'npm:@supabase/supabase-js@2.103.3';
import { normalizeProfile, renderCvHtml } from '../_shared/cv-template.js';

const GITHUB_API_VERSION = '2026-03-10';
const PHOTO_BUCKET = 'cv-photos';
const CV_SOURCE_ROOT = 'public/cv';
const encoder = new TextEncoder();

type CvRecord = {
    id: string;
    user_id: string;
    slug: string;
    content: Record<string, unknown>;
    github_repository: string | null;
    published_url: string | null;
};

type GitTreeEntry = {
    path: string;
    mode: '100644';
    type: 'blob';
    sha: string | null;
};

Deno.serve(async (request) => {
    const corsHeaders = getCorsHeaders(request);
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY');
    const githubToken = Deno.env.get('GITHUB_TOKEN');
    const githubOrg = Deno.env.get('GITHUB_ORG');
    const githubRepository = Deno.env.get('GITHUB_PAGES_REPOSITORY') || 'iprism-servers';
    const configuredBaseUrl = Deno.env.get('GITHUB_PAGES_BASE_URL');

    const missing = Object.entries({
        SUPABASE_URL: supabaseUrl,
        SUPABASE_SECRET_KEY: supabaseSecret,
        GITHUB_TOKEN: githubToken,
        GITHUB_ORG: githubOrg
    }).filter(([, value]) => !value).map(([key]) => key);

    if (missing.length) {
        console.error(`Publisher configuration is missing: ${missing.join(', ')}`);
        return json({ error: 'Publisher configuration is incomplete' }, 503, corsHeaders);
    }
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(githubRepository)) {
        return json({ error: 'GITHUB_PAGES_REPOSITORY is invalid' }, 503, corsHeaders);
    }

    const pagesBaseUrl = normalizePagesBaseUrl(
        configuredBaseUrl || `https://${githubOrg!.toLowerCase()}.github.io/${githubRepository}`
    );
    if (!pagesBaseUrl) return json({ error: 'GITHUB_PAGES_BASE_URL is invalid' }, 503, corsHeaders);

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
        if (body.expectedSlug && body.expectedSlug !== record.slug) throw new Error('The saved public URL changed. Save and publish again.');
        if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(record.slug)) throw new Error('The saved public URL name is invalid');

        const profile = normalizeProfile({ ...record.content, slug: record.slug });
        if (!String(profile.personal.name || '').trim()) throw new Error('Full name is required before publishing');
        if (encoder.encode(JSON.stringify(profile)).byteLength > 500_000) throw new Error('The CV draft is too large to publish');
        if (profile.publications.length > 500) throw new Error('A maximum of 500 publications can be published');

        await admin.from('cv_profiles').update({ publication_status: 'publishing', updated_at: new Date().toISOString() }).eq('user_id', userId);

        const repository = await getRepository(githubOrg!, githubRepository, githubToken!);
        const branch = repository.default_branch || 'main';
        const targetDirectory = `${CV_SOURCE_ROOT}/${record.slug}`;
        const existingMarker = await getRepositoryContent(githubOrg!, githubRepository, `${targetDirectory}/.iprism-cv.json`, githubToken!, branch);
        if (existingMarker && !isManagedMarker(existingMarker.content, record.id)) {
            throw new Error(`The public URL ${record.slug} is already managed by another profile`);
        }

        let publishedPhotoPath = '';
        let publishedPhoto: Uint8Array | null = null;
        const sourcePhotoPath = String(profile.personal.photoPath || '');
        if (sourcePhotoPath) {
            if (!sourcePhotoPath.startsWith(`${userId}/`)) throw new Error('The profile photo path is invalid');
            const { data: photoBlob, error: photoError } = await admin.storage.from(PHOTO_BUCKET).download(sourcePhotoPath);
            if (photoError || !photoBlob) throw new Error('The profile photo could not be prepared for publishing');
            const extension = sourcePhotoPath.split('.').pop()?.toLowerCase();
            if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) throw new Error('The profile photo type is unsupported');
            publishedPhotoPath = `profile.${extension === 'jpeg' ? 'jpg' : extension}`;
            publishedPhoto = new Uint8Array(await photoBlob.arrayBuffer());
        }

        const indexHtml = renderCvHtml(profile, {
            photoUrl: publishedPhotoPath ? `./${publishedPhotoPath}` : ''
        });
        const markerContent = JSON.stringify({ generator: 'iprism-cv', profileId: record.id, version: 2 }, null, 2);
        const previousSlug = getPublishedSlug(record.published_url, pagesBaseUrl);

        await commitCvSite({
            owner: githubOrg!,
            repository: githubRepository,
            branch,
            profileId: record.id,
            targetDirectory,
            previousDirectory: previousSlug && previousSlug !== record.slug ? `${CV_SOURCE_ROOT}/${previousSlug}` : '',
            indexHtml: encoder.encode(indexHtml),
            marker: encoder.encode(markerContent),
            photoName: publishedPhotoPath,
            photo: publishedPhoto,
            token: githubToken!
        });

        const publishedUrl = `${pagesBaseUrl}/cv/${record.slug}/`;
        const now = new Date().toISOString();
        const { error: updateError } = await admin.from('cv_profiles').update({
            publication_status: 'published',
            published_url: publishedUrl,
            github_repository: `${githubOrg}/${githubRepository}`,
            last_published_at: now,
            updated_at: now
        }).eq('user_id', userId);
        if (updateError) throw new Error('The site was published, but its status could not be saved');

        return json({
            status: 'published',
            url: publishedUrl,
            repository: `${githubOrg}/${githubRepository}`
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

async function getRepository(owner: string, repository: string, token: string) {
    const result = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, token);
    return result.data;
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

async function commitCvSite(options: {
    owner: string;
    repository: string;
    branch: string;
    profileId: string;
    targetDirectory: string;
    previousDirectory: string;
    indexHtml: Uint8Array;
    marker: Uint8Array;
    photoName: string;
    photo: Uint8Array | null;
    token: string;
}) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const refBasePath = `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repository)}/git`;
            const ref = await githubRequest(`${refBasePath}/ref/heads/${encodePath(options.branch)}`, options.token);
            const baseCommitSha = ref.data?.object?.sha;
            if (!baseCommitSha) throw new Error('The Pages repository branch could not be resolved');

            const baseCommit = await githubRequest(
                `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repository)}/git/commits/${baseCommitSha}`,
                options.token
            );
            const baseTreeSha = baseCommit.data?.tree?.sha;
            if (!baseTreeSha) throw new Error('The Pages repository tree could not be resolved');

            const entries: GitTreeEntry[] = [];
            const indexBlob = await createBlob(options.owner, options.repository, options.indexHtml, options.token);
            const markerBlob = await createBlob(options.owner, options.repository, options.marker, options.token);
            entries.push(treeEntry(`${options.targetDirectory}/index.html`, indexBlob));
            entries.push(treeEntry(`${options.targetDirectory}/.iprism-cv.json`, markerBlob));

            const targetFiles = await listDirectoryFiles(options.owner, options.repository, options.targetDirectory, options.token, options.branch);
            for (const file of targetFiles.filter((entry) => /^profile\.(?:jpg|png|webp)$/i.test(entry.name))) {
                if (file.name !== options.photoName) entries.push(treeEntry(file.path, null));
            }

            if (options.photo && options.photoName) {
                const photoBlob = await createBlob(options.owner, options.repository, options.photo, options.token);
                entries.push(treeEntry(`${options.targetDirectory}/${options.photoName}`, photoBlob));
            }

            if (options.previousDirectory) {
                const previousMarker = await getRepositoryContent(
                    options.owner,
                    options.repository,
                    `${options.previousDirectory}/.iprism-cv.json`,
                    options.token,
                    options.branch
                );
                if (previousMarker && isManagedMarker(previousMarker.content, options.profileId)) {
                    const previousFiles = await listDirectoryFiles(options.owner, options.repository, options.previousDirectory, options.token, options.branch);
                    entries.push(...previousFiles.map((file) => treeEntry(file.path, null)));
                }
            }

            const tree = await githubRequest(
                `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repository)}/git/trees`,
                options.token,
                {
                    method: 'POST',
                    body: JSON.stringify({ base_tree: baseTreeSha, tree: entries })
                }
            );
            const commit = await githubRequest(
                `/repos/${encodeURIComponent(options.owner)}/${encodeURIComponent(options.repository)}/git/commits`,
                options.token,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        message: `Publish CV: ${options.targetDirectory.split('/').at(-1)}`,
                        tree: tree.data.sha,
                        parents: [baseCommitSha]
                    })
                }
            );
            await githubRequest(`${refBasePath}/refs/heads/${encodePath(options.branch)}`, options.token, {
                method: 'PATCH',
                body: JSON.stringify({ sha: commit.data.sha, force: false })
            });
            return;
        } catch (error) {
            const conflict = error instanceof Error && /GitHub API (409|422)/.test(error.message);
            if (!conflict || attempt === 2) throw error;
            await delay(500 * (attempt + 1));
        }
    }
}

async function createBlob(owner: string, repository: string, content: Uint8Array, token: string) {
    const result = await githubRequest(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/blobs`,
        token,
        {
            method: 'POST',
            body: JSON.stringify({ content: toBase64(content), encoding: 'base64' })
        }
    );
    return result.data.sha as string;
}

async function listDirectoryFiles(owner: string, repository: string, path: string, token: string, branch: string) {
    const content = await getRepositoryContent(owner, repository, path, token, branch);
    if (!Array.isArray(content)) return [];
    return content.filter((entry) => entry?.type === 'file' && typeof entry.path === 'string');
}

function treeEntry(path: string, sha: string | null): GitTreeEntry {
    return { path, mode: '100644', type: 'blob', sha };
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

function isManagedMarker(encodedContent: string, profileId: string) {
    try {
        const marker = JSON.parse(new TextDecoder().decode(fromBase64(encodedContent.replace(/\s/g, ''))));
        return marker.generator === 'iprism-cv' && marker.profileId === profileId;
    } catch {
        return false;
    }
}

function getPublishedSlug(value: string | null, pagesBaseUrl: string) {
    if (!value) return '';
    try {
        const url = new URL(value);
        const base = new URL(`${pagesBaseUrl}/`);
        if (url.origin !== base.origin) return '';
        const expectedPrefix = `${base.pathname.replace(/\/+$/, '')}/cv/`;
        if (!url.pathname.startsWith(expectedPrefix)) return '';
        const slug = url.pathname.slice(expectedPrefix.length).split('/')[0];
        return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug) ? slug : '';
    } catch {
        return '';
    }
}

function normalizePagesBaseUrl(value: string) {
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return '';
        return url.href.replace(/\/+$/, '');
    } catch {
        return '';
    }
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
