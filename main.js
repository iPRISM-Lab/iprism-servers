import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import './cv-builder.css';
import {
    handleCvChange,
    handleCvClick,
    handleCvInput,
    mountCvBuilder,
    unmountCvBuilder
} from './cv-builder.js';

const markdownAssetUrls = import.meta.glob('./assets/**/*', {
    query: '?url',
    import: 'default',
    eager: true
});

const ROUTES = {
    auth: '/auth',
    home: '/'
};

const AMD_GRAFANA_URL = (import.meta.env.VITE_GRAFANA_URL || 'http://195.251.75.20:3030/').trim();
const PORTAINER_AMD_URL = 'https://195.251.57.20:9443/';
const GITHUB_API_VERSION = '2022-11-28';
const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');
const root = document.querySelector('#app-root');

const state = {
    currentSection: 'overview',
    appData: null,
    docsData: {},
    session: null,
    authReady: false,
    flash: '',
    searchOpen: false,
    searchResults: [],
    searchSelectedIndex: -1,
    sidebarOpen: false,
    authCheckId: 0
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const githubOrg = (import.meta.env.VITE_GITHUB_ORG || '').trim();
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            detectSessionInUrl: true
        }
    })
    : null;

marked.use(markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
}));

document.addEventListener('DOMContentLoaded', bootstrap);
window.addEventListener('popstate', () => renderRoute());
window.addEventListener('hashchange', handleHashChange);
document.addEventListener('click', handleClick);
document.addEventListener('change', handleChange);
document.addEventListener('input', handleInput);
document.addEventListener('keydown', handleKeydown);

async function bootstrap() {
    try {
        restoreGithubPagesRoute();
        applyTheme(localStorage.getItem('theme') || 'light');
        state.currentSection = getInitialSection();

        await loadData();
        await loadDocs();
        await initAuth();
    } catch (error) {
        console.error('Initialization failed:', error);
        state.flash = `The app failed to initialize: ${error instanceof Error ? error.message : 'unknown error'}`;
        state.authReady = true;
    }

    renderRoute();
}

async function loadData() {
    const response = await fetch(withBasePath('/tools.json'));
    if (!response.ok) {
        throw new Error(`Failed to load application data (${response.status})`);
    }

    state.appData = await response.json();
}

async function loadDocs() {
    try {
        const docs = import.meta.glob('./docs/*.md', { query: '?raw', import: 'default', eager: true });

        Object.entries(docs).forEach(([path, content]) => {
            const filename = path.split('/').pop().replace('.md', '');
            state.docsData[filename] = {
                title: formatDocTitle(filename),
                content
            };

            if (filename === 'server-nvidia') {
                state.docsData['nvidia-server'] = state.docsData[filename];
            }

            if (filename === 'server-amd') {
                state.docsData['amd-server'] = state.docsData[filename];
            }
        });
    } catch (error) {
        console.error('Failed to load docs:', error);
        state.docsData = {};
    }
}

async function initAuth() {
    if (!supabase) {
        state.authReady = true;
        state.flash = 'Supabase configuration is missing. Add the Vite auth environment variables to enable GitHub sign-in.';
        return;
    }

    supabase.auth.onAuthStateChange((event, session) => {
        void handleAuthStateChange(event, session);
    });

    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Failed to resolve session:', error);
        state.flash = 'Could not restore your session. Please sign in again.';
    }

    await resolveSession(data?.session ?? null);
}

async function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_OUT') {
        state.session = null;
        state.authReady = true;
        renderRoute();
        return;
    }

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        await resolveSession(session);
    }
}

async function resolveSession(session) {
    const checkId = ++state.authCheckId;
    const showLoading = shouldShowAuthLoading();
    state.authReady = false;
    if (showLoading) {
        renderRoute();
    }

    if (!session) {
        state.session = null;
        state.authReady = true;
        if (getCurrentPath() === ROUTES.home) {
            navigateTo(ROUTES.auth, { replace: true });
        } else {
            renderRoute();
        }
        return;
    }

    const verification = await verifyGithubOrganization(session);
    if (checkId !== state.authCheckId) {
        return;
    }

    if (!verification.ok) {
        state.flash = verification.message;
        state.session = null;
        state.authReady = true;
        await supabase.auth.signOut({ scope: 'local' });
        navigateTo(ROUTES.auth, { replace: true });
        return;
    }

    state.session = session;
    state.authReady = true;
    if (getCurrentPath() === ROUTES.auth) {
        state.currentSection = 'overview';
        navigateTo(ROUTES.home, { replace: true, hash: '#overview' });
        return;
    }

    renderRoute();
}

async function verifyGithubOrganization(session) {
    if (!githubOrg) {
        return { ok: true };
    }

    const providerToken = session.provider_token ?? session.providerToken;
    if (!providerToken) {
        return {
            ok: false,
            message: 'GitHub organization verification requires the GitHub OAuth token. Re-authenticate and approve the requested organization scope.'
        };
    }

    try {
        const response = await fetch(`https://api.github.com/user/memberships/orgs/${encodeURIComponent(githubOrg)}`, {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${providerToken}`,
                'X-GitHub-Api-Version': GITHUB_API_VERSION
            }
        });

        if (response.status === 404) {
            return {
                ok: false,
                message: `Your GitHub account is not a member of the ${githubOrg} organization.`
            };
        }

        if (response.status === 403) {
            return {
                ok: false,
                message: 'GitHub organization verification was denied. Confirm that the Supabase GitHub provider is requesting the read:org scope.'
            };
        }

        if (!response.ok) {
            return {
                ok: false,
                message: 'GitHub organization verification failed. Please try again.'
            };
        }

        const membership = await response.json();
        if (membership.state !== 'active') {
            return {
                ok: false,
                message: `Your GitHub membership for ${githubOrg} is not active yet.`
            };
        }

        return { ok: true };
    } catch (error) {
        console.error('GitHub org verification failed:', error);
        return {
            ok: false,
            message: 'GitHub organization verification could not be completed. Please try again.'
        };
    }
}

function renderRoute() {
    if (!root) {
        return;
    }

    if (!state.authReady) {
        root.innerHTML = renderLoadingView();
        syncThemeControls();
        return;
    }

    const path = getCurrentPath();
    if (path === ROUTES.auth) {
        unmountCvBuilder();
        if (hasAppSectionHash()) {
            navigateTo(ROUTES.auth, { replace: true });
            return;
        }

        if (state.session) {
            navigateTo(ROUTES.home, { replace: true, hash: '#overview' });
            return;
        }

        root.innerHTML = renderAuthView();
        syncThemeControls();
        return;
    }

    if (!state.session) {
        unmountCvBuilder();
        navigateTo(ROUTES.auth, { replace: true });
        return;
    }

    state.currentSection = resolveCurrentSectionFromHash();
    root.innerHTML = renderAppView();
    renderSidebar();
    renderContent(state.currentSection);
    syncThemeControls();
}

function renderLoadingView() {
    return `
        <div class="auth-screen">
            <div class="auth-stage glass">
                <div class="auth-card auth-loading-card glass">
                    <div class="loading-orb"></div>
                    <h1>Checking access</h1>
                    <p>Resolving your GitHub session and organization access.</p>
                </div>
            </div>
        </div>
    `;
}

function renderAuthView() {
    const hasConfigMessage = hasSupabaseConfig
        ? ''
        : '<div class="auth-alert auth-alert-error">Supabase is not configured. Add `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` before using this page.</div>';

    const orgMessage = githubOrg
        ? `<p class="auth-meta">Access is limited to GitHub members of <strong>${escapeHtml(githubOrg)}</strong>.</p>`
        : '<p class="auth-meta">GitHub is the only sign-in method for this portal.</p>';

    return `
        <div class="auth-screen">
            <div class="auth-stage glass">
                <section class="auth-panel glass">
                    <div class="auth-header">
                        <img src="${assetUrl('media/Iprism Icons/Icon-iOS-Default-1024x1024@1x.png')}" alt="iPRISM Logo" class="auth-logo">
                        <div class="auth-theme-bar">
                            ${renderThemeSwitch()}
                        </div>
                    </div>
                    <div class="auth-copy">
                        <h1>Sign in to iPRISM Hub</h1>
                        ${orgMessage}
                    </div>
                    <div class="auth-actions">
                        ${state.flash ? `<div class="auth-alert auth-alert-error">${escapeHtml(state.flash)}</div>` : ''}
                        ${hasConfigMessage}
                        <button class="github-button glass" data-action="github-login" ${hasSupabaseConfig ? '' : 'disabled'}>
                            <img src="${assetUrl('media/github-sign.png')}" alt="" class="github-button-icon github-button-icon-light" aria-hidden="true">
                            <img src="${assetUrl('media/github-sign-dark-theme.png')}" alt="" class="github-button-icon github-button-icon-dark" aria-hidden="true">
                            Continue with GitHub
                        </button>
                        <p class="auth-footnote">
                            If access is denied, ask an administrator to review your GitHub access.
                        </p>
                    </div>
                </section>
                <aside class="auth-sidecar glass">
                    <span class="auth-sidecar-label">Welcome</span>
                    <h2>Access the iPRISM internal hub</h2>
                    <p>Sign in with your GitHub account to open the lab handbook, infrastructure notes, and internal server documentation.</p>
                    <div class="auth-sidecar-list">
                        <div class="auth-sidecar-item">
                            <span class="auth-sidecar-title">One secure sign-in</span>
                            <span class="auth-sidecar-text">Use your GitHub account to continue without creating a separate password.</span>
                        </div>
                        <div class="auth-sidecar-item">
                            <span class="auth-sidecar-title">Internal content only</span>
                            <span class="auth-sidecar-text">The hub contains private documentation for lab infrastructure and shared systems.</span>
                        </div>
                        <div class="auth-sidecar-item">
                            <span class="auth-sidecar-title">Access review</span>
                            <span class="auth-sidecar-text">${githubOrg ? `Only approved members associated with ${escapeHtml(githubOrg)} can continue.` : 'Access is granted only to approved users managed by the lab administrators.'}</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    `;
}

function renderAppView() {
    const user = state.session?.user ?? {};
    const userName = user.user_metadata?.full_name || user.user_metadata?.user_name || user.email || 'Authenticated user';

    return `
        <div class="app-layout">
            <aside class="sidebar glass ${state.sidebarOpen ? 'sidebar-open' : ''}" id="sidebar">
                <button class="sidebar-close glass" data-action="close-sidebar" aria-label="Close menu">×</button>
                <div class="sidebar-header">
                    <div class="logo">
                        <img src="${assetUrl('media/Iprism Icons/Icon-iOS-Default-1024x1024@1x.png')}" alt="iPRISM Logo" style="height: 38px; width: auto;">
                    </div>
                    <span class="app-title">iPRISM Hub</span>
                </div>

                <nav class="sidebar-nav" id="sidebar-nav"></nav>

                <div class="sidebar-footer">
                    <div class="theme-switch-wrapper">
                        <span class="theme-label">Dark Mode</span>
                        ${renderThemeSwitch()}
                    </div>
                </div>
            </aside>

            <main class="content-area">
                <header class="top-bar">
                    <div class="mobile-nav-trigger">
                        <button class="hamburger-menu glass" data-action="open-sidebar" aria-label="Open menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                    <div class="search-container glass" id="search-trigger" data-action="open-search">
                        <span class="search-icon"></span>
                        <span class="search-placeholder">Search documentation...</span>
                        <span class="search-shortcut">Ctrl+K</span>
                    </div>
                    <div class="top-actions">
                        <div class="user-badge glass">
                            <span class="user-name">${escapeHtml(userName)}</span>
                        </div>
                        <button class="top-action-button glass" data-action="sign-out">Sign out</button>
                    </div>
                </header>

                <div class="scroll-container" id="main-content"></div>
            </main>
        </div>

        <div class="sidebar-overlay ${state.sidebarOpen ? 'visible' : ''}" data-action="close-sidebar"></div>

        <div id="command-palette" class="modal-overlay ${state.searchOpen ? '' : 'hidden'}">
            <div class="modal-content glass">
                <div class="search-input-wrapper">
                    <span class="search-icon"></span>
                    <input type="text" id="search-input" placeholder="Type to search..." autocomplete="off">
                </div>
                <div id="search-results" class="search-results"></div>
                <div class="search-footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>

        <div id="tool-modal" class="modal-overlay hidden">
            <div class="modal-content glass tool-modal-card">
                <div class="modal-header glass tool-modal-header">
                    <img id="modal-tool-img" src="" alt="" class="tool-modal-image">
                    <h2 id="modal-tool-name">Tool Name</h2>
                </div>
                <div class="modal-body tool-modal-body">
                    <p id="modal-tool-desc">Tool description goes here.</p>
                </div>
                <div class="modal-footer glass tool-modal-footer">
                    <button class="glass top-action-button" data-action="close-tool-modal">Close</button>
                </div>
            </div>
        </div>

    `;
}

function renderThemeSwitch() {
    return `
        <span class="theme-switch-control">
            <span class="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
            <span class="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
            <label class="theme-switch">
                <input type="checkbox" data-theme-toggle>
                <span class="slider glass"></span>
            </label>
        </span>
    `;
}

function renderSidebar() {
    const nav = document.querySelector('#sidebar-nav');
    if (!nav || !state.appData) {
        return;
    }

    let html = `
        <div class="nav-group">
            <div class="nav-group-title">Main</div>
            ${renderNavLinks(state.appData.sidebarData.filter((item) => item.type === 'main'))}
        </div>
        <div class="nav-group">
            <div class="nav-group-title">Infrastructure</div>
            ${renderNavLinks(state.appData.sidebarData.filter((item) => item.type === 'infra'))}
        </div>
        <div class="nav-group">
            <div class="nav-group-title">Operations</div>
            ${renderNavLinks(state.appData.sidebarData.filter((item) => item.type === 'ops'))}
        </div>
    `;

    const sidebarSectionIds = new Set(state.appData.sidebarData.map((item) => item.id));
    const hiddenDocKeys = new Set(['server-nvidia', 'server-amd']);
    const sortedDocKeys = Object.keys(state.docsData)
        .filter((key) => !sidebarSectionIds.has(key) && !hiddenDocKeys.has(key))
        .sort();
    if (sortedDocKeys.length) {
        html += `
            <div class="nav-group">
                <div class="nav-group-title">Documentation</div>
                ${sortedDocKeys.map((key) => `
                    <a href="#doc-${key}" class="nav-item ${state.currentSection === `doc-${key}` ? 'active' : ''}" data-section="doc-${key}">
                        <span class="nav-text">${escapeHtml(state.docsData[key].title)}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    const user = state.session?.user ?? {};
    const userName = user.user_metadata?.full_name || user.user_metadata?.user_name || user.email || 'Authenticated user';

    html += `
        <div class="sidebar-user-info mobile-only">
            <div class="nav-group-title">User</div>
            <div class="user-badge-mini glass">
                <span class="user-name">${escapeHtml(userName)}</span>
            </div>
            <button class="sign-out-btn-mini glass" data-action="sign-out">Sign out</button>
        </div>
    `;

    nav.innerHTML = html;
}

function renderNavLinks(items) {
    return items.map((item) => `
        <a href="#${item.id}" class="nav-item ${state.currentSection === item.id ? 'active' : ''}" data-section="${item.id}">
            <span class="nav-text">${escapeHtml(item.title)}</span>
        </a>
    `).join('');
}

function renderContent(sectionId) {
    const container = document.querySelector('#main-content');
    if (!container || !state.appData) {
        return;
    }

    unmountCvBuilder();
    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';

    if (sectionId === 'overview') {
        renderDashboard(wrapper);
    } else if (sectionId === 'cv-builder') {
        void mountCvBuilder(wrapper, {
            supabase,
            session: state.session,
            publicBaseUrl: `${window.location.origin}${withBasePath('/cv')}`
        });
    } else if (state.docsData[sectionId]) {
        renderMarkdownPage(sectionId, wrapper);
    } else if (sectionId.startsWith('doc-')) {
        renderMarkdownPage(sectionId.replace('doc-', ''), wrapper);
    } else {
        renderGenericPage(sectionId, wrapper);
    }

    container.innerHTML = '';
    container.appendChild(wrapper);
}

function renderDashboard(container) {
    const header = `
        <div class="dashboard-header">
            <h1>iPRISM Lab Infrastructure</h1>
            <p>Welcome to the central hub for server documentation and resource management.</p>
        </div>
    `;

    const grids = state.appData.serviceCards.map((group) => `
        <div class="grid-section">
            <h3 class="nav-group-title dashboard-group-title">${escapeHtml(group.category)}</h3>
            <div class="grid-container">
                ${group.tools.map((tool) => {
                    const references = getToolReferences(tool);
                    return `
                    <div class="service-card glass tool-card" data-tool-name="${escapeHtml(tool.name)}" data-tool-img="${escapeHtml(tool.img)}">
                        ${references.length ? `
                            <div class="tool-card-links">
                                ${references.map((reference) => `
                                    <a href="${escapeHtml(reference.href)}" class="tool-card-link" data-tool-link="${escapeHtml(reference.href)}" ${reference.external ? 'target="_blank" rel="noopener noreferrer"' : ''} aria-label="Open ${escapeHtml(reference.label.toLowerCase())} reference for ${escapeHtml(tool.name)}">
                                        ${escapeHtml(reference.label)}
                                    </a>
                                `).join('')}
                            </div>
                        ` : ''}
                        <img src="${escapeHtml(tool.img)}" class="card-icon" alt="${escapeHtml(tool.name)}">
                        <div class="card-title">${escapeHtml(tool.name)}</div>
                        <div class="card-desc">${escapeHtml(tool.desc)}</div>
                    </div>
                `;
                }).join('')}
            </div>
        </div>
    `).join('');

    container.innerHTML = header + grids;
}

function renderMarkdownPage(docId, container) {
    const doc = state.docsData[docId];
    if (!doc) {
        renderGenericPage('Document Not Found', container);
        return;
    }

    let rendered = renderMarkdownWithCallouts(doc.content);

    if (isAmdPortainerDocument(doc)) {
        const portainerAction = `
            <a class="doc-action-button glass" href="${escapeHtml(PORTAINER_AMD_URL)}" target="_blank" rel="noopener noreferrer" aria-label="Open AMD Portainer in a new tab" title="Open AMD Portainer">
                <span class="monitor-link-button-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Z" />
                        <path d="M5 5h6v2H7v10h10v-4h2v6H5V5Z" />
                    </svg>
                </span>
                <span>Open Portainer</span>
            </a>
        `;

        rendered = injectMarkdownTitleActions(
            rendered,
            getFirstMarkdownHeadingId(doc.content),
            [portainerAction]
        );
    }

    if (docId === 'amd-server') {
        // TODO: iframe commented out until grafana is exposed with https and not http
        /*
        const embeddedContent = AMD_GRAFANA_URL
            ? `
                <div class="embedded-grafana-wrapper glass">
                    <iframe src="${escapeHtml(AMD_GRAFANA_URL)}" frameborder="0" width="100%" height="700px" allowtransparency="true" style="border: none; border-radius: 12px; width: 100%; height: 700px;"></iframe>
                </div>
            `
            : `
                <div class="embedded-grafana-wrapper glass">
                    <p>Grafana embed is not configured for this deployment.</p>
                </div>
            `;
        rendered = rendered.replace('</h1>', `</h1>${embeddedContent}`);
        */

        const grafanaAction = `
            <a class="doc-action-button glass" href="${escapeHtml(AMD_GRAFANA_URL)}" target="_blank" rel="noopener noreferrer" aria-label="Open AMD Grafana dashboard in a new tab" title="Open AMD Grafana">
                <span class="monitor-link-button-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M13 2 6 13h4l-1 9 9-13h-4l1-7Z" />
                    </svg>
                </span>
                <span>Grafana</span>
            </a>
        `;
        const portainerAction = `
            <a class="doc-action-button glass" href="${escapeHtml(PORTAINER_AMD_URL)}" target="_blank" rel="noopener noreferrer" aria-label="Open AMD Portainer in a new tab" title="Open AMD Portainer">
                <span class="monitor-link-button-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Z" />
                        <path d="M5 5h6v2H7v10h10v-4h2v6H5V5Z" />
                    </svg>
                </span>
                <span>Portainer</span>
            </a>
        `;

        rendered = injectMarkdownTitleActions(
            rendered,
            'amd-server',
            [grafanaAction, portainerAction]
        );
    }

    container.innerHTML = `
        <div class="markdown-body">
            ${rendered}
        </div>
    `;

    container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    enhanceMarkdownCommandBlocks(container);
    enhanceMarkdownLinks(container);
    scrollToCurrentHashAnchor();
}

function renderMarkdownWithCallouts(content) {
    const normalized = normalizeMarkdownCallouts(content);

    return resolveMarkdownAssetUrls(marked.parse(normalized, { renderer: createMarkdownRenderer() }));
}

function injectMarkdownTitleActions(rendered, headingId, actions) {
    const titlePattern = new RegExp(`(<h1 id="${escapeRegExp(headingId)}">[\\s\\S]*?<\\/h1>)`);
    const actionsHtml = actions.length
        ? `<div class="markdown-title-actions">${actions.join('')}</div>`
        : '';

    return rendered.replace(
        titlePattern,
        `<div class="markdown-title-row">$1${actionsHtml}</div>`
    );
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveMarkdownAssetUrls(html) {
    return html.replace(/\s(src|href)="(\.?\/?assets\/[^"]+)"/g, (match, attribute, rawPath) => {
        const assetUrl = getMarkdownAssetUrl(rawPath);
        return assetUrl ? ` ${attribute}="${escapeHtml(assetUrl)}"` : match;
    });
}

function getMarkdownAssetUrl(rawPath) {
    const normalizedPath = rawPath.replace(/^\.?\//, '');

    return markdownAssetUrls[`./${normalizedPath}`] || '';
}

function isAmdPortainerDocument(doc) {
    return /^#\s+.*portainer.*amd.*server/im.test(doc.content);
}

function getFirstMarkdownHeadingId(content) {
    const heading = marked.lexer(content).find((token) => token.type === 'heading');
    return heading ? slugifyMarkdownHeading(heading.text) : '';
}

function normalizeMarkdownCallouts(content) {
    return content.replace(
        /^>\s*\[!WARNING\]\s*\n((?:>\s?.*(?:\n|$))+)/gm,
        (_match, body) => renderMarkdownCallout('Warning', body)
    ).replace(
        /^>\s*\[!WARNING\]\s+(.+)$/gm,
        (_match, body) => renderMarkdownCallout('Warning', body)
    );
}

function renderMarkdownCallout(title, body) {
    const markdown = String(body)
        .split(/\r?\n/)
        .map((line) => line.replace(/^>\s?/, ''))
        .join('\n')
        .trim();
    const html = marked.parse(markdown);

    return `<div class="markdown-callout markdown-callout-warning"><strong>${escapeHtml(title)}</strong>${html}</div>`;
}

function createMarkdownRenderer() {
    const renderer = new marked.Renderer();
    const headingCounts = new Map();

    renderer.heading = function heading(token) {
        const baseId = slugifyMarkdownHeading(token.text);
        const count = headingCounts.get(baseId) ?? 0;
        headingCounts.set(baseId, count + 1);

        const id = count ? `${baseId}-${count}` : baseId;
        const content = this.parser.parseInline(token.tokens);

        return `<h${token.depth} id="${escapeHtml(id)}">${content}</h${token.depth}>`;
    };

    return renderer;
}

function slugifyMarkdownHeading(text) {
    const slug = String(text)
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .replace(/\s/g, '-');

    return slug || 'section';
}

function enhanceMarkdownCommandBlocks(container) {
    container.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code');
        if (!code || !isShellCodeBlock(code)) {
            return;
        }

        pre.classList.add('markdown-command-block');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-command-button';
        button.setAttribute('aria-label', 'Copy command to clipboard');
        button.setAttribute('title', 'Copy command');
        button.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V9Zm-6 4V5a2 2 0 0 1 2-2h8" />
            </svg>
        `;

        const feedback = document.createElement('span');
        feedback.className = 'copy-command-feedback';
        feedback.setAttribute('aria-live', 'polite');

        button.addEventListener('click', async () => {
            const command = code.textContent ?? '';
            const copied = await copyTextToClipboard(command);

            button.classList.toggle('copied', copied);
            button.setAttribute('aria-label', copied ? 'Command copied' : 'Copy failed');
            button.setAttribute('title', copied ? 'Copied' : 'Copy failed');
            feedback.textContent = copied ? 'Copied to clipboard' : 'Copy failed';
            feedback.classList.add('visible');

            window.setTimeout(() => {
                button.classList.remove('copied');
                button.setAttribute('aria-label', 'Copy command to clipboard');
                button.setAttribute('title', 'Copy command');
                feedback.classList.remove('visible');
            }, 1600);
        });

        pre.appendChild(button);
        pre.appendChild(feedback);
    });
}

function enhanceMarkdownLinks(container) {
    const markdownBody = container.querySelector('.markdown-body');
    if (!markdownBody) {
        return;
    }

    markdownBody.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const anchorId = getAnchorIdFromHref(link.getAttribute('href'));
            if (!anchorId) {
                return;
            }

            const target = document.getElementById(anchorId);
            if (!target || !markdownBody.contains(target)) {
                return;
            }

            event.preventDefault();
            window.history.pushState({}, '', `${withBasePath(ROUTES.home)}#${state.currentSection}/${anchorId}`);
            scrollToMarkdownAnchor(anchorId, { smooth: true });
        });
    });
}

function getAnchorIdFromHref(href) {
    if (!href || href === '#') {
        return '';
    }

    try {
        return decodeURIComponent(href.slice(1));
    } catch {
        return href.slice(1);
    }
}

function isShellCodeBlock(codeElement) {
    const classes = Array.from(codeElement.classList);
    return classes.some((className) => /language-(bash|shell|sh|zsh|console|terminal)/.test(className));
}

async function copyTextToClipboard(text) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (error) {
        console.error('Clipboard write failed:', error);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } catch (error) {
        console.error('Fallback copy failed:', error);
        return false;
    } finally {
        document.body.removeChild(textarea);
    }
}

function formatDocTitle(filename) {
    const normalized = filename.replace(/^server-/, '');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, ' ');
}

function renderServerPage(id, container) {
    const data = state.appData.serverData[id];
    container.innerHTML = `
        <div class="markdown-body">
            <h1>${escapeHtml(data.title)}</h1>

            ${data.spec ? `
                <div class="spec-grid glass server-spec-grid">
                    ${Object.entries(data.spec).map(([key, value]) => `
                        <div>
                            <div class="server-spec-label">${escapeHtml(key)}</div>
                            <div class="server-spec-value">${escapeHtml(value)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${data.warn ? `<div class="warning glass server-warning">${escapeHtml(data.warn)}</div>` : ''}
            ${data.ssh ? `<h2>SSH Access</h2><pre><code>${escapeHtml(data.ssh)}</code></pre>` : ''}

            ${data.ports ? `
                <h2>Network Configuration</h2>
                <table>
                    <thead>
                        <tr><th>Service</th><th>Port</th></tr>
                    </thead>
                    <tbody>
                        ${data.ports.map((port) => `<tr><td>${escapeHtml(port.service)}</td><td><code>${escapeHtml(port.port)}</code></td></tr>`).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${data.users ? `
                <h2>Active Users</h2>
                <div class="server-user-list">
                    ${data.users.map((user) => `<span class="glass server-user-pill">${escapeHtml(user)}</span>`).join('')}
                </div>
            ` : ''}

            ${data.table ? `
                <h2>Backup Strategy</h2>
                <table>
                    <thead>
                        <tr><th>Type</th><th>Frequency</th><th>Location</th></tr>
                    </thead>
                    <tbody>
                        ${data.table.map((row) => `
                            <tr>
                                <td>${escapeHtml(row.type)}</td>
                                <td>${escapeHtml(row.frequency)}</td>
                                <td><code>${escapeHtml(row.location)}</code></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${data.tools ? `
                <h2>Monitoring Tools</h2>
                <div class="grid-container">
                    ${data.tools.map((tool) => `
                        <div class="service-card glass">
                            <div class="card-title">${escapeHtml(tool.name)}</div>
                            <div class="card-desc">${escapeHtml(tool.desc)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${data.items ? `
                <h2>Useful Commands</h2>
                ${data.items.map((item) => `
                    <div class="server-command">
                        <div class="server-command-label">${escapeHtml(item.desc)}</div>
                        <pre><code>${escapeHtml(item.cmd)}</code></pre>
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `;
}

function renderGenericPage(id, container) {
    const item = state.appData?.sidebarData?.find((entry) => entry.id === id);
    container.innerHTML = `
        <div class="markdown-body">
            <h1>${escapeHtml(item?.title || id)}</h1>
            <p>Section details are coming soon.</p>
            <div class="glass generic-state">
                <span class="generic-state-icon">Maintenance Mode</span>
                <h3>Documentation stub</h3>
            </div>
        </div>
    `;
}

function openSearch() {
    state.searchOpen = true;
    state.searchSelectedIndex = -1;
    const palette = document.querySelector('#command-palette');
    if (palette) {
        palette.classList.remove('hidden');
    }

    const input = document.querySelector('#search-input');
    if (input) {
        input.value = '';
        input.focus();
    }

    performSearch('');
}

function closeSearch() {
    state.searchOpen = false;
    state.searchResults = [];
    state.searchSelectedIndex = -1;
    const palette = document.querySelector('#command-palette');
    if (palette) {
        palette.classList.add('hidden');
    }
}

function performSearch(query) {
    const resultsContainer = document.querySelector('#search-results');
    if (!resultsContainer || !state.appData) {
        return;
    }

    const lowered = query.toLowerCase();
    const allItems = [
        ...state.appData.sidebarData,
        ...state.appData.serviceCards.flatMap((group) =>
            group.tools
                .flatMap((tool) => getToolReferences(tool).map((reference) => {
                    if (!reference?.href?.startsWith('#')) {
                        return null;
                    }

                    return { ...tool, title: `${tool.name} ${reference.label}`, id: reference.href.replace('#', '') };
                }))
                .filter(Boolean)
        ),
        ...Object.keys(state.docsData)
            .filter((key) => !state.appData.sidebarData.some((item) => item.id === key) && key !== 'server-nvidia' && key !== 'server-amd')
            .map((key) => ({
            title: state.docsData[key].title,
            id: `doc-${key}`,
            desc: 'Internal document'
        }))
    ];

    const filtered = allItems.filter((item) =>
        item.title?.toLowerCase().includes(lowered)
        || item.name?.toLowerCase().includes(lowered)
        || item.desc?.toLowerCase().includes(lowered)
    ).slice(0, 8);

    state.searchResults = filtered;
    state.searchSelectedIndex = filtered.length ? 0 : -1;

    resultsContainer.innerHTML = filtered.map((item) => `
        <button class="search-item ${state.searchSelectedIndex === filtered.indexOf(item) ? 'selected' : ''}" data-section-target="${item.id}">
            <span class="search-item-title">${escapeHtml(item.title || item.name)}</span>
            <span class="search-item-snippet">${escapeHtml(item.desc || 'Internal document')}</span>
        </button>
    `).join('');
}

function updateSearchSelection(nextIndex) {
    const items = Array.from(document.querySelectorAll('.search-item'));
    if (!items.length) {
        state.searchSelectedIndex = -1;
        return;
    }

    const normalizedIndex = ((nextIndex % items.length) + items.length) % items.length;
    state.searchSelectedIndex = normalizedIndex;

    items.forEach((item, index) => {
        item.classList.toggle('selected', index === normalizedIndex);
    });

    items[normalizedIndex].scrollIntoView({
        block: 'nearest'
    });
}

function activateSelectedSearchResult() {
    if (state.searchSelectedIndex < 0 || state.searchSelectedIndex >= state.searchResults.length) {
        return;
    }

    const selected = state.searchResults[state.searchSelectedIndex];
    if (!selected?.id) {
        return;
    }

    state.currentSection = selected.id;
    window.location.hash = selected.id;
    closeSearch();
}

function getToolReferences(tool) {
    if (Array.isArray(tool?.links)) {
        return tool.links
            .filter((reference) => reference?.href)
            .map((reference) => ({
                href: reference.href,
                label: reference.label || (isExternalHref(reference.href) ? 'URL' : 'Handbook'),
                external: reference.external ?? isExternalHref(reference.href)
            }));
    }

    if (tool?.handbook?.href) {
        return [{
            href: tool.handbook.href,
            label: tool.handbook.label || 'Handbook',
            external: isExternalHref(tool.handbook.href)
        }];
    }

    if (tool?.link) {
        return [{
            href: tool.link,
            label: isExternalHref(tool.link) ? 'URL' : 'Handbook',
            external: isExternalHref(tool.link)
        }];
    }

    return [];
}

function isExternalHref(href) {
    return /^https?:\/\//i.test(href);
}

function openToolModal(toolName, imgSrc) {
    const modal = document.querySelector('#tool-modal');
    if (!modal || !state.appData) {
        return;
    }

    const nameEl = document.querySelector('#modal-tool-name');
    const imgEl = document.querySelector('#modal-tool-img');
    const descEl = document.querySelector('#modal-tool-desc');
    if (!nameEl || !imgEl || !descEl) {
        return;
    }

    nameEl.textContent = toolName;
    imgEl.src = imgSrc;
    imgEl.alt = toolName;
    descEl.textContent = state.appData.toolDetails[toolName] || 'Specific information about this tool will be enhanced later.';
    modal.classList.remove('hidden');
}

function closeToolModal() {
    const modal = document.querySelector('#tool-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function handleHashChange() {
    if (getCurrentPath() !== ROUTES.home || !state.session) {
        return;
    }

    let route = getHashRoute();
    if (!isKnownSection(route.section) && scrollCurrentMarkdownPageToAnchor(route.section)) {
        window.history.replaceState({}, '', `${withBasePath(ROUTES.home)}#${state.currentSection}/${route.section}`);
        return;
    }

    if (!isKnownSection(route.section)) {
        const documentSection = findDocumentSectionByAnchor(route.section);
        if (documentSection) {
            window.history.replaceState({}, '', `${withBasePath(ROUTES.home)}#${documentSection}/${route.section}`);
            route = getHashRoute();
        }
    }

    state.currentSection = route.section;
    toggleSidebar(false);
    renderSidebar();
    renderContent(state.currentSection);
}

async function handleClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    if (await handleCvClick(event)) {
        return;
    }

    const themeToggleClicked = target.closest('[data-theme-toggle]');
    if (themeToggleClicked) {
        return;
    }

    const searchBackdrop = target.id === 'command-palette';
    if (searchBackdrop) {
        closeSearch();
        return;
    }

    const toolBackdrop = target.id === 'tool-modal';
    if (toolBackdrop) {
        closeToolModal();
        return;
    }

    const actionNode = target.closest('[data-action]');
    if (actionNode instanceof HTMLElement) {
        const action = actionNode.dataset.action;

        if (action === 'open-sidebar') {
            event.preventDefault();
            toggleSidebar(true);
            return;
        }

        if (action === 'close-sidebar') {
            event.preventDefault();
            toggleSidebar(false);
            return;
        }

        if (action === 'github-login') {
            event.preventDefault();
            await signInWithGithub();
            return;
        }

        if (action === 'sign-out') {
            event.preventDefault();
            state.flash = '';
            if (supabase) {
                await supabase.auth.signOut({ scope: 'local' });
            }
            return;
        }

        if (action === 'open-search') {
            event.preventDefault();
            openSearch();
            return;
        }

        if (action === 'close-tool-modal') {
            event.preventDefault();
            closeToolModal();
            return;
        }
    }

    const sectionLink = target.closest('[data-section]');
    if (sectionLink instanceof HTMLElement) {
        event.preventDefault();
        const section = sectionLink.dataset.section;
        if (section) {
            window.location.hash = section;
        }
        return;
    }

    const searchTarget = target.closest('[data-section-target]');
    if (searchTarget instanceof HTMLElement) {
        const section = searchTarget.dataset.sectionTarget;
        if (section) {
            state.currentSection = section;
            window.location.hash = section;
            closeSearch();
        }
        return;
    }

    const toolLink = target.closest('[data-tool-link]');
    if (toolLink instanceof HTMLAnchorElement) {
        const href = toolLink.getAttribute('href');
        if (href?.startsWith('#')) {
            event.preventDefault();
            window.location.hash = href.slice(1);
        }
        return;
    }

    const toolCard = target.closest('[data-tool-name]');
    if (toolCard instanceof HTMLElement) {
        const toolName = toolCard.dataset.toolName;
        const toolImg = toolCard.dataset.toolImg;
        if (toolName && toolImg) {
            openToolModal(toolName, toolImg);
        }
    }
}

async function handleChange(event) {
    if (await handleCvChange(event)) {
        return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
        return;
    }

    if (target.matches('[data-theme-toggle]')) {
        applyTheme(target.checked ? 'dark' : 'light');
    }
}

function handleInput(event) {
    if (handleCvInput(event)) {
        return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
        return;
    }

    if (target.id === 'search-input') {
        performSearch(target.value);
    }
}

function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && state.session && getCurrentPath() === ROUTES.home) {
        event.preventDefault();
        openSearch();
        return;
    }

    if (state.searchOpen) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            updateSearchSelection(state.searchSelectedIndex + 1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            updateSearchSelection(state.searchSelectedIndex - 1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            activateSelectedSearchResult();
            return;
        }
    }

    if (event.key === 'Escape') {
        closeSearch();
        closeToolModal();
    }
}

async function signInWithGithub() {
    if (!supabase) {
        state.flash = 'Supabase is not configured yet.';
        renderRoute();
        return;
    }

    state.flash = '';
    renderRoute();

    const scopes = githubOrg ? 'read:org' : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: `${window.location.origin}${withBasePath(ROUTES.auth)}`,
            scopes
        }
    });

    if (error) {
        console.error('GitHub sign-in failed:', error);
        state.flash = 'GitHub sign-in could not be started.';
        renderRoute();
    }
}

function navigateTo(path, options = {}) {
    const normalized = normalizePath(path);
    const current = getCurrentPath();
    const targetPath = withBasePath(normalized);
    const targetUrl = options.hash ? `${targetPath}${options.hash}` : targetPath;
    if (targetUrl === `${window.location.pathname}${window.location.hash}`) {
        renderRoute();
        return;
    }

    const method = options.replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', targetUrl);
    renderRoute();
}

function getCurrentPath() {
    const pathname = window.location.pathname;
    const relativePath = APP_BASE_PATH && pathname.startsWith(APP_BASE_PATH)
        ? pathname.slice(APP_BASE_PATH.length) || '/'
        : pathname;

    return normalizePath(relativePath);
}

function normalizePath(pathname) {
    if (!pathname || pathname === '/') {
        return '/';
    }

    return pathname.replace(/\/+$/, '') || '/';
}

function resolveCurrentSectionFromHash() {
    const route = getHashRoute();
    if (isKnownSection(route.section)) {
        return route.section;
    }

    const documentSection = findDocumentSectionByAnchor(route.section);
    if (!documentSection) {
        return route.section;
    }

    window.history.replaceState({}, '', `${withBasePath(ROUTES.home)}#${documentSection}/${route.section}`);
    return documentSection;
}

function getHashRoute() {
    const hash = window.location.hash.slice(1);
    if (!hash || isAuthCallbackHash(hash)) {
        return {
            section: 'overview',
            anchor: ''
        };
    }

    const [section, ...anchorParts] = hash.split('/');

    return {
        section: section || 'overview',
        anchor: anchorParts.join('/')
    };
}

function scrollToCurrentHashAnchor() {
    const { anchor } = getHashRoute();
    if (!anchor) {
        return;
    }

    scrollToMarkdownAnchor(anchor);
}

function scrollCurrentMarkdownPageToAnchor(anchorId) {
    const markdownBody = document.querySelector('.markdown-body');
    const target = anchorId ? document.getElementById(anchorId) : null;
    if (!markdownBody || !target || !markdownBody.contains(target)) {
        return false;
    }

    scrollToMarkdownAnchor(anchorId);
    return true;
}

function scrollToMarkdownAnchor(anchorId, options = {}) {
    window.requestAnimationFrame(() => {
        const target = document.getElementById(anchorId);
        if (!target) {
            return;
        }

        target.scrollIntoView({
            block: 'start',
            behavior: options.smooth ? 'smooth' : 'auto'
        });
    });
}

function isKnownSection(sectionId) {
    if (!sectionId || sectionId === 'overview') {
        return true;
    }

    if (state.docsData[sectionId]) {
        return true;
    }

    if (sectionId.startsWith('doc-') && state.docsData[sectionId.replace('doc-', '')]) {
        return true;
    }

    return Boolean(state.appData?.sidebarData?.some((item) => item.id === sectionId));
}

function findDocumentSectionByAnchor(anchorId) {
    if (!anchorId) {
        return '';
    }

    for (const docId of getDocumentLookupOrder()) {
        const doc = state.docsData[docId];
        if (doc?.content && getMarkdownHeadingIds(doc.content).includes(anchorId)) {
            return getDocumentSectionId(docId);
        }
    }

    return '';
}

function getDocumentLookupOrder() {
    const sidebarDocIds = state.appData?.sidebarData
        ?.map((item) => item.id)
        .filter((id) => state.docsData[id]) ?? [];
    const remainingDocIds = Object.keys(state.docsData)
        .filter((id) => !sidebarDocIds.includes(id));

    return [...sidebarDocIds, ...remainingDocIds];
}

function getDocumentSectionId(docId) {
    const hasSidebarItem = state.appData?.sidebarData?.some((item) => item.id === docId);
    return hasSidebarItem ? docId : `doc-${docId}`;
}

function getMarkdownHeadingIds(content) {
    const counts = new Map();

    return marked.lexer(content)
        .filter((token) => token.type === 'heading')
        .map((token) => {
            const baseId = slugifyMarkdownHeading(token.text);
            const count = counts.get(baseId) ?? 0;
            counts.set(baseId, count + 1);

            return count ? `${baseId}-${count}` : baseId;
        });
}

function getInitialSection() {
    const { section } = getHashRoute();
    if (!section) {
        return 'overview';
    }

    return section;
}

function isAuthCallbackHash(hash) {
    return hash.startsWith('access_token=')
        || hash.startsWith('refresh_token=')
        || hash.startsWith('error=')
        || hash.startsWith('error_code=')
        || hash.startsWith('token_type=');
}

function hasAppSectionHash() {
    const hash = window.location.hash.slice(1);
    return Boolean(hash) && !isAuthCallbackHash(hash);
}

function applyTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.body.className = normalized;
    localStorage.setItem('theme', normalized);
    syncThemeControls();
}

function syncThemeControls() {
    const isDark = document.body.classList.contains('dark');
    document.querySelectorAll('[data-theme-toggle]').forEach((input) => {
        input.checked = isDark;
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function restoreGithubPagesRoute() {
    const url = new URL(window.location.href);
    const route = url.searchParams.get('route');
    if (!route) {
        return;
    }

    const restoredPath = normalizePath(stripBasePath(route));
    const restoredQuery = url.searchParams.get('q') || '';
    const nextPath = withBasePath(restoredPath);
    const nextUrl = `${window.location.origin}${nextPath}${restoredQuery}${window.location.hash}`;

    window.history.replaceState({}, '', nextUrl);
}

function withBasePath(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (!APP_BASE_PATH) {
        return normalized;
    }

    if (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) {
        return normalized;
    }

    return `${APP_BASE_PATH}${normalized}`;
}

function assetUrl(path) {
    return withBasePath(path);
}

function stripBasePath(path) {
    if (!APP_BASE_PATH) {
        return path;
    }

    return path.startsWith(APP_BASE_PATH) ? path.slice(APP_BASE_PATH.length) || '/' : path;
}

function shouldShowAuthLoading() {
    return isAuthCallbackHash(window.location.hash.slice(1));
}

function toggleSidebar(open) {
    state.sidebarOpen = open;
    const sidebar = document.querySelector('#sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-open', open);
    }
    if (overlay) {
        overlay.classList.toggle('visible', open);
    }
}
