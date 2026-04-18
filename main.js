import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// --- State & Data Management ---
let currentSection = 'overview';
let appData = null;
let docsData = {};

const isDark = () => document.body.classList.contains('dark');

// Configure Marked with modern extension system
marked.use(markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
}));

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadData();
        await loadDocs();
        initTheme();
        handleRouting();
    } catch (err) {
        console.error('Initialization failed:', err);
    }

    window.addEventListener('hashchange', handleRouting);
});

async function loadData() {
    try {
        const response = await fetch('/tools.json');
        if (!response.ok) throw new Error('Data fetch failed');
        appData = await response.json();
    } catch (error) {
        console.error('Failed to load application data:', error);
    }
}

async function loadDocs() {
    try {
        // Use relative path for Vite discovery
        const docs = import.meta.glob('./docs/*.md', { query: '?raw', import: 'default', eager: true });

        Object.entries(docs).forEach(([path, content]) => {
            const filename = path.split('/').pop().replace('.md', '');
            docsData[filename] = {
                title: filename.charAt(0).toUpperCase() + filename.slice(1).replace(/-/g, ' '),
                content: content
            };
        });
    } catch (error) {
        console.error('Failed to discover documents:', error);
    }
}

// --- Theme Logic ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;

    const themeToggle = $('#theme-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.body.className = newTheme;
            localStorage.setItem('theme', newTheme);
        });
    }
}

// --- Navigation Logic ---
function renderSidebar() {
    const nav = $('#sidebar-nav');
    if (!nav) return;
    if (!appData) {
        nav.innerHTML = '<div class="nav-group"><div class="nav-group-title">Loading Hub Data...</div></div>';
        return;
    }

    let html = '';

    // Main Sections
    html += `
        <div class="nav-group">
            <div class="nav-group-title">Main</div>
            ${appData.sidebarData.filter(d => d.type === 'main').map(d => `
                <a href="#${d.id}" class="nav-item ${currentSection === d.id ? 'active' : ''}" data-section="${d.id}">
                    <span class="nav-text">${d.title}</span>
                </a>
            `).join('')}
        </div>
    `;

    // Infrastructure
    html += `
        <div class="nav-group">
            <div class="nav-group-title">Infrastructure</div>
            ${appData.sidebarData.filter(d => d.type === 'infra').map(d => `
                <a href="#${d.id}" class="nav-item ${currentSection === d.id ? 'active' : ''}" data-section="${d.id}">
                    <span class="nav-text">${d.title}</span>
                </a>
            `).join('')}
        </div>
    `;

    // Operations
    html += `
        <div class="nav-group">
            <div class="nav-group-title">Operations</div>
            ${appData.sidebarData.filter(d => d.type === 'ops').map(d => `
                <a href="#${d.id}" class="nav-item ${currentSection === d.id ? 'active' : ''}" data-section="${d.id}">
                    <span class="nav-text">${d.title}</span>
                </a>
            `).join('')}
        </div>
    `;

    // Dynamic Docs (Sorted alphabetically)
    const sortedDocKeys = Object.keys(docsData).sort();
    if (sortedDocKeys.length > 0) {
        html += `
            <div class="nav-group">
                <div class="nav-group-title">Documentation</div>
                ${sortedDocKeys.map(key => `
                    <a href="#doc-${key}" class="nav-item ${currentSection === 'doc-' + key ? 'active' : ''}" data-section="doc-${key}">
                        <span class="nav-text">${docsData[key].title}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    nav.innerHTML = html;

    // Attach listeners after re-render
    nav.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = item.getAttribute('data-section');
            if (section) setActiveSection(section);
        });
    });
}

function setActiveSection(sectionId) {
    currentSection = sectionId;
    renderSidebar();
    renderContent(sectionId);
}

function handleRouting() {
    const hash = window.location.hash.slice(1) || 'overview';
    setActiveSection(hash);
}

// --- Search Logic ---
function setupSearch() {
    const palette = $('#command-palette');
    const input = $('#search-input');
    const trigger = $('#search-trigger');

    if (!trigger) return;

    trigger.addEventListener('click', openPalette);

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openPalette();
        }
        if (e.key === 'Escape') {
            closePalette();
            const modal = $('#tool-modal');
            if (modal) modal.classList.add('hidden');
        }
    });

    if (palette) {
        palette.addEventListener('click', (e) => {
            if (e.target === palette) closePalette();
        });
    }

    const toolModal = $('#tool-modal');
    if (toolModal) {
        toolModal.addEventListener('click', (e) => {
            if (e.target === toolModal) toolModal.classList.add('hidden');
        });
    }

    if (input) {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            performSearch(query);
        });
    }

    function openPalette() {
        if (!palette) return;
        palette.classList.remove('hidden');
        if (input) {
            input.value = '';
            input.focus();
        }
        performSearch('');
    }

    function closePalette() {
        if (palette) palette.classList.add('hidden');
    }
}

function performSearch(query) {
    const resultsContainer = $('#search-results');
    if (!resultsContainer || !appData) return;
    resultsContainer.innerHTML = '';

    const allItems = [
        ...appData.sidebarData,
        ...appData.serviceCards.flatMap(c => c.tools.map(t => ({ ...t, id: t.link.slice(1) }))),
        ...Object.keys(docsData).map(key => ({ title: docsData[key].title, id: 'doc-' + key, desc: 'Internal Document' }))
    ];

    const filtered = allItems.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.desc?.toLowerCase().includes(query)
    ).slice(0, 8);

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            <div class="search-item-title">${item.title || item.name}</div>
            <div class="search-item-snippet">${item.desc || 'Internal Document'}</div>
        `;
        div.onclick = () => {
            window.location.hash = item.id;
            const palette = $('#command-palette');
            if (palette) palette.classList.add('hidden');
        };
        resultsContainer.appendChild(div);
    });
}

// --- Tool Modal Logic ---
function openToolModal(toolName, imgSrc) {
    const modal = $('#tool-modal');
    if (!modal || !appData) return;

    $('#modal-tool-name').innerText = toolName;
    $('#modal-tool-img').src = imgSrc;
    $('#modal-tool-desc').innerText = appData.toolDetails[toolName] || 'Specific information about this tool will be enhanced later.';
    modal.classList.remove('hidden');
}

// --- Content Rendering ---
function renderContent(sectionId) {
    const container = $('#main-content');
    if (!container || !appData) return;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';

    if (sectionId === 'overview') {
        renderDashboard(wrapper);
    } else if (sectionId.startsWith('doc-')) {
        renderMarkdownPage(sectionId.replace('doc-', ''), wrapper);
    } else if (appData.serverData[sectionId]) {
        renderServerPage(sectionId, wrapper);
    } else {
        renderGenericPage(sectionId, wrapper);
    }

    container.appendChild(wrapper);
    setupSearch(); // Re-bind search triggers if moved
}

function renderDashboard(container) {
    const header = `
        <div class="dashboard-header">
            <h1>iPRISM Lab Infrastructure</h1>
            <p>Welcome to the central hub for server documentation and resource management.</p>
        </div>
    `;

    let grids = '';
    appData.serviceCards.forEach(group => {
        grids += `
            <div class="grid-section">
                <h3 class="nav-group-title" style="margin-top: 32px">${group.category}</h3>
                <div class="grid-container">
                    ${group.tools.map(tool => `
                        <div class="service-card glass tool-card" data-name="${tool.name}" data-img="${tool.img}">
                            <img src="${tool.img}" class="card-icon" alt="${tool.name}">
                            <div class="card-title">${tool.name}</div>
                            <div class="card-desc">${tool.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = header + grids;

    container.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const name = card.getAttribute('data-name');
            const img = card.getAttribute('data-img');
            openToolModal(name, img);
        });
    });
}

async function renderMarkdownPage(docId, container) {
    const doc = docsData[docId];
    if (!doc) {
        renderGenericPage('Document Not Found', container);
        return;
    }

    container.innerHTML = `
        <div class="markdown-body">
            ${marked.parse(doc.content)}
        </div>
    `;

    // Refresh highlight.js for the newly rendered code blocks
    container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function renderServerPage(id, container) {
    const data = appData.serverData[id];
    container.innerHTML = `
        <div class="markdown-body">
            <h1>${data.title}</h1>
            
            ${data.spec ? `
                <div class="spec-grid glass" style="padding: 20px; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    ${Object.entries(data.spec).map(([k, v]) => `
                        <div>
                            <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary)">${k}</div>
                            <div style="font-weight: 600">${v}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${data.warn ? `<div class="warning glass" style="margin-top: 20px; padding: 16px; border-left: 4px solid #ffcc00; background: rgba(255, 204, 0, 0.1)"> ${data.warn}</div>` : ''}

            ${data.ssh ? `<h2>SSH Access</h2><pre><code>${data.ssh}</code></pre>` : ''}

            ${data.ports ? `
                <h2>Network Configuration</h2>
                <table>
                    <thead>
                        <tr><th>Service</th><th>Port</th></tr>
                    </thead>
                    <tbody>
                        ${data.ports.map(p => `<tr><td>${p.service}</td><td><code>${p.port}</code></td></tr>`).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${data.users ? `
                <h2>Active Users</h2>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px;">
                    ${data.users.map(user => `
                        <span class="glass" style="padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; color: var(--text-primary); border: 1px solid var(--glass-border);">
                            ${user}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
            
            ${data.table ? `
                <h2>Backup Strategy</h2>
                <table>
                    <thead>
                        <tr><th>Type</th><th>Frequency</th><th>Location</th></tr>
                    </thead>
                    <tbody>
                        ${data.table.map(row => `<tr><td>${row.type}</td><td>${row.frequency}</td><td><code>${row.location}</code></td></tr>`).join('')}
                    </tbody>
                </table>
            ` : ''}

            ${data.tools ? `
                <h2>Monitoring Tools</h2>
                <div class="grid-container">
                    ${data.tools.map(tool => `
                        <div class="service-card glass">
                            <div class="card-title">${tool.name}</div>
                            <div class="card-desc">${tool.desc}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${data.items ? `
                <h2>Useful Commands</h2>
                ${data.items.map(item => `
                    <div style="margin-bottom: 24px">
                        <div style="font-weight: 600; margin-bottom: 8px">${item.desc}</div>
                        <pre><code>${item.cmd}</code></pre>
                    </div>
                `).join('')}
            ` : ''}
        </div>
    `;
}

function renderGenericPage(id, container) {
    const item = appData?.sidebarData?.find(d => d.id === id);
    container.innerHTML = `
        <div class="markdown-body">
            <h1>${item?.title || id}</h1>
            <p>Section details are coming soon...</p>
            <div class="glass" style="padding: 40px; text-align: center; border-radius: 20px;">
                <span style="font-size: 3rem">🚧</span>
                <h3>Maintenance Mode</h3>
            </div>
        </div>
    `;
}
