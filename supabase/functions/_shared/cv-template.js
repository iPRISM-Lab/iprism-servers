export const PROGRAMMING_LANGUAGES = [
    { key: 'python', label: 'Python', icon: 'python', color: '3776AB' },
    { key: 'javascript', label: 'JavaScript', icon: 'javascript', color: 'F7DF1E' },
    { key: 'typescript', label: 'TypeScript', icon: 'typescript', color: '3178C6' },
    { key: 'cpp', label: 'C++', icon: 'cplusplus', color: '00599C' },
    { key: 'csharp', label: 'C#', icon: 'sharp', color: '512BD4' },
    { key: 'java', label: 'Java', icon: 'openjdk', color: '437291' },
    { key: 'r', label: 'R', icon: 'r', color: '276DC3' },
    { key: 'julia', label: 'Julia', icon: 'julia', color: '9558B2' },
    { key: 'matlab', label: 'MATLAB', iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons/matlab/matlab-original.svg' },
    { key: 'rust', label: 'Rust', icon: 'rust', color: 'DEA584' },
    { key: 'go', label: 'Go', icon: 'go', color: '00ADD8' },
    { key: 'kotlin', label: 'Kotlin', icon: 'kotlin', color: '7F52FF' },
    { key: 'swift', label: 'Swift', icon: 'swift', color: 'F05138' },
    { key: 'shell', label: 'Shell', icon: 'gnubash', color: '4EAA25' },
    { key: 'sql', label: 'SQL', icon: 'postgresql', color: '4169E1' },
    { key: 'cuda', label: 'CUDA', icon: 'nvidia', color: '76B900' }
];

export const PUBLICATION_TYPES = [
    'Journal article',
    'Conference paper',
    'Book chapter',
    'Preprint',
    'Thesis',
    'Dataset',
    'Software',
    'Other'
];

const languageByKey = new Map(PROGRAMMING_LANGUAGES.map((language) => [language.key, language]));

export function getProgrammingLanguageIconUrl(language) {
    if (!language) return '';
    return language.iconUrl || `https://cdn.simpleicons.org/${language.icon}/${language.color}`;
}

export function createEmptyProfile(slug = '') {
    return {
        slug,
        personal: {
            name: '',
            headline: '',
            email: '',
            phone: '',
            location: '',
            website: '',
            orcid: '',
            summary: '',
            photoPath: '',
            showEmail: true,
            showPhone: false
        },
        positions: [],
        education: [],
        publications: [],
        awards: [],
        skills: []
    };
}

export function normalizeProfile(value = {}) {
    const base = createEmptyProfile();
    const personal = value.personal && typeof value.personal === 'object' ? value.personal : {};

    return {
        ...base,
        ...value,
        slug: String(value.slug || ''),
        personal: {
            ...base.personal,
            ...personal,
            showEmail: personal.showEmail !== false,
            showPhone: personal.showPhone === true
        },
        positions: normalizeCollection(value.positions),
        education: normalizeCollection(value.education),
        publications: normalizeCollection(value.publications),
        awards: normalizeCollection(value.awards),
        skills: normalizeCollection(value.skills)
    };
}

export function renderCvHtml(profileValue, options = {}) {
    const profile = normalizeProfile(profileValue);
    const personal = profile.personal;
    const fullName = personal.name.trim() || 'Your name';
    const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'CV';
    const title = options.preview ? `${fullName} - CV preview` : `${fullName} - Curriculum Vitae`;
    const photoUrl = safeAssetUrl(options.photoUrl || '');
    const positions = profile.positions.filter(hasVisibleValue);
    const education = profile.education.filter(hasVisibleValue);
    const publications = profile.publications
        .filter(hasVisibleValue)
        .sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured)) || Number(right.year || 0) - Number(left.year || 0));
    const awards = profile.awards.filter(hasVisibleValue);
    const skills = profile.skills
        .map((skill) => ({ ...skill, language: languageByKey.get(skill.key) }))
        .filter((skill) => skill.language);
    const contactItems = renderContactItems(personal);

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Curriculum vitae of ${escapeHtml(fullName)}">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: blob: https://cdn.simpleicons.org https://cdn.jsdelivr.net https://*.supabase.co; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <title>${escapeHtml(title)}</title>
    <style>${renderTemplateCss()}</style>
</head>
<body>
    <div class="cv-page">
        <aside class="cv-sidebar">
            <div class="identity-media">
                ${photoUrl
                    ? `<img class="profile-photo" src="${escapeHtml(photoUrl)}" alt="Portrait of ${escapeHtml(fullName)}">`
                    : `<div class="profile-placeholder" aria-label="Profile initials">${escapeHtml(initials)}</div>`}
            </div>
            ${contactItems ? `<section class="side-section"><h2>Contact</h2><div class="contact-list">${contactItems}</div></section>` : ''}
            ${skills.length ? `
                <section class="side-section">
                    <h2>Programming</h2>
                    <div class="skills-list">
                        ${skills.map(renderSkill).join('')}
                    </div>
                </section>
            ` : ''}
        </aside>
        <main class="cv-content">
            <header class="cv-header">
                <p class="document-label">Curriculum Vitae</p>
                <h1>${escapeHtml(fullName)}</h1>
                ${personal.headline ? `<p class="headline">${escapeHtml(personal.headline)}</p>` : ''}
                ${personal.summary ? `<p class="summary">${formatText(personal.summary)}</p>` : ''}
            </header>
            ${renderPositions(positions)}
            ${renderEducation(education)}
            ${renderPublications(publications)}
            ${renderAwards(awards)}
        </main>
    </div>
</body>
</html>`;
}

function renderContactItems(personal) {
    const items = [];
    if (personal.location) {
        items.push(renderContactItem('Location', escapeHtml(personal.location)));
    }
    if (personal.showEmail && personal.email) {
        const email = String(personal.email).trim();
        items.push(renderContactItem('Email', `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`));
    }
    if (personal.showPhone && personal.phone) {
        const phone = String(personal.phone).trim();
        items.push(renderContactItem('Phone', `<a href="tel:${escapeHtml(phone.replace(/[^+\d]/g, ''))}">${escapeHtml(phone)}</a>`));
    }
    if (personal.website) {
        const website = safeWebUrl(personal.website);
        if (website) {
            items.push(renderContactItem('Website', `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(compactUrl(website))}</a>`));
        }
    }
    if (personal.orcid) {
        const orcid = String(personal.orcid).replace(/^https?:\/\/orcid\.org\//i, '').trim();
        if (/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(orcid)) {
            items.push(renderContactItem('ORCID', `<a href="https://orcid.org/${escapeHtml(orcid)}" target="_blank" rel="noopener noreferrer">${escapeHtml(orcid)}</a>`));
        }
    }
    return items.join('');
}

function renderContactItem(label, value) {
    return `<div class="contact-item"><span>${escapeHtml(label)}</span><div>${value}</div></div>`;
}

function renderSkill(skill) {
    const language = skill.language;
    const level = String(skill.level || '').trim();
    const iconUrl = getProgrammingLanguageIconUrl(language);
    return `
        <div class="skill-item">
            <img src="${iconUrl}" alt="" aria-hidden="true">
            <div><strong>${escapeHtml(language.label)}</strong>${level ? `<span>${escapeHtml(level)}</span>` : ''}</div>
        </div>
    `;
}

function renderPositions(items) {
    if (!items.length) return '';
    return renderSection('Academic appointments', items.map((item) => `
        <article class="timeline-item">
            <div class="item-heading">
                <div><h3>${escapeHtml(item.role || 'Academic position')}</h3><p>${escapeHtml(joinVisible([item.institution, item.location], ' · '))}</p></div>
                <span>${escapeHtml(formatPeriod(item.start, item.current ? 'Present' : item.end))}</span>
            </div>
            ${item.summary ? `<p class="item-copy">${formatText(item.summary)}</p>` : ''}
        </article>
    `).join(''));
}

function renderEducation(items) {
    if (!items.length) return '';
    return renderSection('Education', items.map((item) => `
        <article class="timeline-item">
            <div class="item-heading">
                <div><h3>${escapeHtml(joinVisible([item.degree, item.field], ' in ') || 'Degree')}</h3><p>${escapeHtml(item.institution || '')}</p></div>
                <span>${escapeHtml(formatPeriod(item.startYear, item.endYear))}</span>
            </div>
            ${item.details ? `<p class="item-copy">${formatText(item.details)}</p>` : ''}
        </article>
    `).join(''));
}

function renderPublications(items) {
    if (!items.length) return '';
    return renderSection('Selected publications', `<ol class="publication-list">${items.map((item) => {
        const links = [];
        const url = safeWebUrl(item.url || '');
        const doiValue = String(item.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
        if (doiValue) links.push(`<a href="https://doi.org/${escapeHtml(encodeURI(doiValue))}" target="_blank" rel="noopener noreferrer">DOI</a>`);
        if (url) links.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open</a>`);
        return `
            <li class="publication-item ${item.featured ? 'featured' : ''}">
                <div class="publication-meta"><span>${escapeHtml(item.type || 'Publication')}</span>${item.year ? `<time>${escapeHtml(item.year)}</time>` : ''}</div>
                <h3>${escapeHtml(item.title || 'Untitled publication')}</h3>
                ${item.authors ? `<p>${escapeHtml(item.authors)}</p>` : ''}
                ${item.venue ? `<p class="venue">${escapeHtml(item.venue)}</p>` : ''}
                ${links.length ? `<div class="publication-links">${links.join('')}</div>` : ''}
            </li>`;
    }).join('')}</ol>`);
}

function renderAwards(items) {
    if (!items.length) return '';
    return renderSection('Awards & recognition', items.map((item) => `
        <article class="award-item">
            <div><h3>${escapeHtml(item.title || 'Award')}</h3><p>${escapeHtml(item.issuer || '')}</p></div>
            ${item.year ? `<time>${escapeHtml(item.year)}</time>` : ''}
            ${item.description ? `<p class="item-copy">${formatText(item.description)}</p>` : ''}
        </article>
    `).join(''));
}

function renderSection(title, content) {
    return `<section class="content-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

function normalizeCollection(value) {
    return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function hasVisibleValue(item) {
    return Object.entries(item).some(([key, value]) => key !== 'id' && key !== 'featured' && key !== 'current' && Boolean(String(value ?? '').trim()));
}

function joinVisible(values, separator) {
    return values.map((value) => String(value || '').trim()).filter(Boolean).join(separator);
}

function formatPeriod(start, end) {
    return joinVisible([start, end], ' – ');
}

function compactUrl(value) {
    try {
        const url = new URL(value);
        return `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')}`;
    } catch {
        return value;
    }
}

function safeWebUrl(value) {
    const input = String(value || '').trim();
    if (!input) return '';
    try {
        const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

function safeAssetUrl(value) {
    const input = String(value || '').trim();
    if (!input) return '';
    if (/^(\.\/|\/)[A-Za-z0-9._/-]+$/.test(input)) return input;
    try {
        const url = new URL(input);
        return ['https:', 'blob:', 'data:'].includes(url.protocol) ? input : '';
    } catch {
        return '';
    }
}

function formatText(value) {
    return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderTemplateCss() {
    return `
        :root { color-scheme: light; font-family: Inter, Arial, sans-serif; color: #17212b; background: #e9edf0; }
        * { box-sizing: border-box; }
        html { background: #e9edf0; }
        body { margin: 0; background: #e9edf0; }
        a { color: #086788; text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; }
        .cv-page { width: min(1060px, 100%); min-height: 100vh; margin: 0 auto; display: grid; grid-template-columns: 270px minmax(0, 1fr); background: #ffffff; box-shadow: 0 12px 50px rgba(23, 33, 43, .12); }
        .cv-sidebar { padding: 48px 30px; background: #eef3f2; border-right: 1px solid #d5dfdc; }
        .identity-media { width: 156px; aspect-ratio: 1; margin-bottom: 40px; }
        .profile-photo, .profile-placeholder { width: 100%; height: 100%; border-radius: 4px; }
        .profile-photo { display: block; object-fit: cover; filter: saturate(.88); }
        .profile-placeholder { display: grid; place-items: center; background: #194f5b; color: #fff; font: 700 44px/1 Georgia, serif; }
        .side-section { margin-top: 34px; }
        .side-section h2, .content-section > h2 { margin: 0 0 18px; color: #194f5b; font-size: 12px; line-height: 1.2; text-transform: uppercase; letter-spacing: 1.6px; }
        .contact-list { display: grid; gap: 16px; }
        .contact-item > span { display: block; margin-bottom: 3px; color: #66747a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; }
        .contact-item div, .contact-item a { color: #25343a; font-size: 12px; line-height: 1.5; }
        .skills-list { display: grid; grid-template-columns: 1fr; gap: 13px; }
        .skill-item { min-width: 0; display: grid; grid-template-columns: 23px minmax(0, 1fr); align-items: center; gap: 10px; }
        .skill-item img { width: 21px; height: 21px; object-fit: contain; }
        .skill-item strong, .skill-item span { display: block; }
        .skill-item strong { font-size: 12px; }
        .skill-item span { margin-top: 2px; color: #66747a; font-size: 10px; }
        .cv-content { min-width: 0; padding: 58px 64px 70px; }
        .cv-header { padding-bottom: 34px; border-bottom: 3px solid #194f5b; }
        .document-label { margin: 0 0 15px; color: #8b6b14; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.8px; }
        h1 { margin: 0; color: #17212b; font: 700 46px/1.05 Georgia, 'Times New Roman', serif; letter-spacing: 0; overflow-wrap: anywhere; }
        .headline { margin: 14px 0 0; color: #3d5058; font-size: 17px; line-height: 1.5; }
        .summary { max-width: 690px; margin: 23px 0 0; color: #526269; font-size: 13px; line-height: 1.75; }
        .content-section { padding-top: 34px; }
        .content-section > h2 { display: flex; align-items: center; gap: 14px; font-size: 13px; }
        .content-section > h2::after { content: ''; height: 1px; flex: 1; background: #cfd9d6; }
        .timeline-item { padding: 2px 0 22px; }
        .timeline-item + .timeline-item { padding-top: 22px; border-top: 1px solid #e3e8e6; }
        .item-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
        h3 { margin: 0; color: #17212b; font: 700 16px/1.35 Georgia, 'Times New Roman', serif; }
        .item-heading p, .award-item > div p { margin: 5px 0 0; color: #526269; font-size: 12px; line-height: 1.45; }
        .item-heading > span, time { flex: 0 0 auto; color: #8b6b14; font-size: 11px; font-weight: 700; line-height: 1.5; }
        .item-copy { margin: 10px 0 0; color: #526269; font-size: 12px; line-height: 1.65; }
        .publication-list { margin: 0; padding: 0; list-style: none; counter-reset: publications; }
        .publication-item { position: relative; padding: 0 0 24px 36px; counter-increment: publications; }
        .publication-item + .publication-item { padding-top: 22px; border-top: 1px solid #e3e8e6; }
        .publication-item::before { content: counter(publications, decimal-leading-zero); position: absolute; top: 1px; left: 0; color: #8b6b14; font: 700 11px/1.5 Arial, sans-serif; }
        .publication-item + .publication-item::before { top: 23px; }
        .publication-item.featured { border-left: 3px solid #d3a82f; padding-left: 32px; margin-left: 0; }
        .publication-item.featured::before { left: 9px; }
        .publication-meta { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 7px; }
        .publication-meta span { color: #66747a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; }
        .publication-item > p { margin: 6px 0 0; color: #526269; font-size: 12px; line-height: 1.55; }
        .publication-item > p.venue { color: #194f5b; font-style: italic; }
        .publication-links { display: flex; gap: 13px; margin-top: 8px; }
        .publication-links a { font-size: 11px; font-weight: 700; }
        .award-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 24px; padding: 0 0 20px; }
        .award-item + .award-item { padding-top: 20px; border-top: 1px solid #e3e8e6; }
        .award-item .item-copy { grid-column: 1 / -1; }
        @media print {
            @page { size: A4; margin: 0; }
            html, body { background: #fff; }
            .cv-page { width: 100%; box-shadow: none; }
            a { color: inherit; }
        }
        @media (max-width: 720px) {
            .cv-page { grid-template-columns: 1fr; }
            .cv-sidebar { padding: 28px 24px; border-right: 0; border-bottom: 1px solid #d5dfdc; display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 8px 28px; }
            .identity-media { width: 110px; margin: 0; grid-row: 1 / span 2; }
            .side-section { margin: 0; }
            .side-section + .side-section { margin-top: 22px; }
            .skills-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .cv-content { padding: 38px 24px 50px; }
            h1 { font-size: 36px; }
            .item-heading { display: grid; gap: 8px; }
        }
        @media (max-width: 440px) {
            .cv-sidebar { grid-template-columns: 1fr; }
            .identity-media { grid-row: auto; }
            .skills-list { grid-template-columns: 1fr; }
        }
    `;
}
