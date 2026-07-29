import {
    PROGRAMMING_LANGUAGES,
    PUBLICATION_TYPES,
    createEmptyProfile,
    normalizeProfile
} from './supabase/functions/_shared/cv-template.js';

const SECTION_ALIASES = {
    summary: ['about', 'profile', 'professional profile', 'professional summary', 'research profile', 'summary'],
    positions: ['academic appointments', 'academic positions', 'appointments', 'employment', 'employment history', 'experience', 'professional experience', 'work experience'],
    education: ['academic background', 'education', 'education and training', 'qualifications'],
    publications: ['articles', 'papers', 'publications', 'research output', 'selected publications'],
    awards: ['awards', 'awards and honors', 'awards and recognition', 'fellowships', 'honors', 'honours'],
    skills: ['computational skills', 'programming', 'programming languages', 'skills', 'technical skills']
};

const PERSONAL_FIELDS = [
    ['name', 'Full name'],
    ['headline', 'Professional headline'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['location', 'Location'],
    ['website', 'Website'],
    ['orcid', 'ORCID'],
    ['summary', 'Professional summary']
];

const COLLECTION_LABELS = {
    positions: 'Academic positions',
    education: 'Education',
    publications: 'Publications',
    awards: 'Awards',
    skills: 'Programming languages'
};

const DEGREE_PATTERN = /\b(ph\.?d\.?|doctor(?:ate|al)?|m\.?sc\.?|master(?:'s)?|m\.?eng\.?|b\.?sc\.?|bachelor(?:'s)?|b\.?eng\.?|diploma|degree)\b/i;
const ROLE_PATTERN = /\b(professor|researcher|scientist|lecturer|fellow|engineer|director|manager|associate|assistant|postdoc(?:toral)?|consultant|developer)\b/i;
const INSTITUTION_PATTERN = /\b(university|institute|college|school|laborator(?:y|ies)|\blab\b|centre|center|department|academy|hospital|foundation|corporation|company|ltd\.?|inc\.?)\b/i;
const HEADING_WORD_LIMIT = 7;

export function parseCvText(rawText, entities = []) {
    const text = normalizeText(rawText);
    const lines = text.split('\n');
    const sections = splitSections(lines);
    const profile = createEmptyProfile();
    const personal = parsePersonal(sections, entities);

    profile.personal = { ...profile.personal, ...personal };
    profile.positions = parsePositions(sections.positions || [], entities);
    profile.education = parseEducation(sections.education || [], entities);
    profile.publications = parsePublications(sections.publications || []);
    profile.awards = parseAwards(sections.awards || []);
    profile.skills = parseSkills(sections.skills?.length ? sections.skills : lines);

    return normalizeProfile(profile);
}

export function buildImportReview(currentValue, importedValue) {
    const current = normalizeProfile(currentValue);
    const imported = normalizeProfile(importedValue);
    const candidates = [];

    for (const [field, label] of PERSONAL_FIELDS) {
        const value = cleanValue(imported.personal[field]);
        if (!value || value === cleanValue(current.personal[field])) continue;
        candidates.push({
            key: `personal.${field}`,
            group: 'Personal details',
            label,
            summary: compact(value, 180),
            selected: !cleanValue(current.personal[field])
        });
    }

    for (const collection of Object.keys(COLLECTION_LABELS)) {
        imported[collection].forEach((item, index) => {
            if (!hasVisibleValue(item) || current[collection].some((existing) => collectionIdentity(collection, existing) === collectionIdentity(collection, item))) return;
            candidates.push({
                key: `${collection}.${index}`,
                group: COLLECTION_LABELS[collection],
                label: describeCollectionItem(collection, item),
                summary: describeCollectionDetails(collection, item),
                selected: true
            });
        });
    }

    return candidates;
}

export function applyImportReview(currentValue, importedValue, selectedKeys) {
    const current = normalizeProfile(structuredCloneSafe(currentValue));
    const imported = normalizeProfile(importedValue);
    const selected = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);

    for (const [field] of PERSONAL_FIELDS) {
        if (selected.has(`personal.${field}`)) current.personal[field] = imported.personal[field];
    }

    for (const collection of Object.keys(COLLECTION_LABELS)) {
        imported[collection].forEach((item, index) => {
            if (!selected.has(`${collection}.${index}`)) return;
            if (current[collection].some((existing) => collectionIdentity(collection, existing) === collectionIdentity(collection, item))) return;
            current[collection].push({ ...item, id: item.id || createId() });
        });
    }

    return normalizeProfile(current);
}

function parsePersonal(sections, entities) {
    const preamble = (sections.preamble || []).filter(Boolean).slice(0, 24);
    const contactText = preamble.join('\n');
    const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
    const orcid = contactText.match(/(?:https?:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-[\dX]{4}/i)?.[0]?.replace(/^https?:\/\/orcid\.org\//i, '') || '';
    const website = findWebsite(contactText);
    const phone = findPhone(contactText);
    const name = findName(preamble, entities);
    const nameIndex = preamble.findIndex((line) => normalizeComparable(line) === normalizeComparable(name));
    const headline = findHeadline(preamble, nameIndex, name);
    const summary = compactParagraph((sections.summary || []).join(' '), 1200);
    const location = findLocation(preamble, entities, email, phone);

    return { name, headline, email, phone, location, website, orcid, summary };
}

function parsePositions(lines, entities) {
    const organizations = entityValues(entities, 'ORG');
    return splitEntryBlocks(lines).map((block, index) => {
        const dateRange = parseDateRange(block.join(' '));
        const meaningful = block.map(removeDateRange).map(cleanValue).filter(Boolean);
        const role = meaningful.find((line) => ROLE_PATTERN.test(line)) || meaningful[0] || '';
        let institution = meaningful.find((line) => line !== role && INSTITUTION_PATTERN.test(line)) || '';
        if (!institution) institution = organizations.find((organization) => block.some((line) => includesLoose(line, organization))) || '';
        const location = meaningful.find((line) => line !== role && line !== institution && looksLikeLocation(line)) || '';
        const summary = meaningful.filter((line) => ![role, institution, location].includes(line)).join(' ');
        return {
            id: `import-position-${index}`,
            role,
            institution,
            location,
            start: toMonthValue(dateRange.start),
            end: dateRange.current ? '' : toMonthValue(dateRange.end),
            current: dateRange.current,
            summary: compactParagraph(summary, 600)
        };
    }).filter(hasVisibleValue);
}

function parseEducation(lines, entities) {
    const organizations = entityValues(entities, 'ORG');
    return splitEntryBlocks(lines).map((block, index) => {
        const dateRange = parseDateRange(block.join(' '));
        const meaningful = block.map(removeDateRange).map(cleanValue).filter(Boolean);
        const degreeLine = meaningful.find((line) => DEGREE_PATTERN.test(line)) || meaningful[0] || '';
        const degreeParts = degreeLine.match(/^(.+?)(?:\s+in\s+|,\s*)(.+)$/i);
        const degree = degreeParts?.[1] || degreeLine;
        const field = degreeParts?.[2] || '';
        let institution = meaningful.find((line) => line !== degreeLine && INSTITUTION_PATTERN.test(line)) || '';
        if (!institution) institution = organizations.find((organization) => block.some((line) => includesLoose(line, organization))) || '';
        const details = meaningful.filter((line) => ![degreeLine, institution].includes(line)).join(' ');
        return {
            id: `import-education-${index}`,
            degree,
            field,
            institution,
            startYear: dateRange.start,
            endYear: dateRange.end,
            details: compactParagraph(details, 600)
        };
    }).filter(hasVisibleValue);
}

function parsePublications(lines) {
    return splitPublicationEntries(lines).map((entry, index) => {
        const raw = entry.join(' ').replace(/^\s*(?:\[?\d+\]?|[A-Z])\s*[.)]\s*/, '').trim();
        const doi = raw.match(/10\.\d{4,9}\/[\w.()/:;-]+/i)?.[0]?.replace(/[.,;]+$/, '') || '';
        const url = raw.match(/https?:\/\/[^\s,)]+/i)?.[0]?.replace(/[.,;]+$/, '') || '';
        const years = [...raw.matchAll(/\b(?:19|20)\d{2}\b/g)].map((match) => match[0]);
        const year = years.at(-1) || '';
        const withoutLinks = raw
            .replace(url, ' ')
            .replace(doi, ' ')
            .replace(/\bdoi\s*:\s*/ig, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const quotedTitle = withoutLinks.match(/["“]([^"”]{6,})["”]/)?.[1] || '';
        const segments = splitCitationSegments(withoutLinks);
        const authors = looksLikeAuthors(segments[0]) ? segments.shift() || '' : '';
        let title = quotedTitle || segments.shift() || withoutLinks;
        if (quotedTitle) title = quotedTitle;
        title = title.replace(new RegExp(`[,;]?\\s*\\(?${escapeRegex(year)}\\)?[.,;]?\\s*$`), '').trim();
        const venue = segments.join('. ').replace(new RegExp(`[,;]?\\s*\\(?${escapeRegex(year)}\\)?[.,;]?\\s*$`), '').trim();
        return {
            id: `import-publication-${index}`,
            type: inferPublicationType(raw),
            title: compact(title, 500),
            authors: compact(authors, 500),
            venue: compact(venue, 300),
            year,
            doi,
            url,
            featured: false
        };
    }).filter((item) => item.title && item.title.length > 3).slice(0, 500);
}

function parseAwards(lines) {
    return splitEntryBlocks(lines).map((block, index) => {
        const joined = block.join(' ');
        const year = joined.match(/\b(?:19|20)\d{2}\b/)?.[0] || '';
        const meaningful = block.map((line) => cleanValue(line.replace(year, ''))).filter(Boolean);
        return {
            id: `import-award-${index}`,
            title: meaningful[0] || '',
            issuer: meaningful[1] || '',
            year,
            description: meaningful.slice(2).join(' ')
        };
    }).filter(hasVisibleValue);
}

function parseSkills(lines) {
    const text = lines.join(' ');
    const matches = [];
    const aliases = {
        cpp: /(?:^|[,;/\s])C\+\+(?=$|[,;/\s])/i,
        csharp: /(?:^|[,;/\s])C#(?=$|[,;/\s])/i,
        shell: /\b(?:Bash|Shell scripting)\b/i,
        sql: /\b(?:SQL|PostgreSQL|MySQL)\b/i,
        r: /(?:^|[,;/\s])R(?:$|[,;/\s])/,
        go: /\bGolang\b|\bGo\b(?=\s*(?:language|programming|,|;|$))/i
    };

    PROGRAMMING_LANGUAGES.forEach((language) => {
        const pattern = aliases[language.key] || new RegExp(`\\b${escapeRegex(language.label)}\\b`, 'i');
        if (pattern.test(text)) matches.push({ id: `import-skill-${language.key}`, key: language.key, level: 'Proficient' });
    });
    return matches;
}

function splitSections(lines) {
    const sections = { preamble: [] };
    let current = 'preamble';
    for (const rawLine of lines) {
        const line = cleanValue(rawLine);
        const section = identifySection(line);
        if (section) {
            current = section;
            sections[current] ||= [];
            continue;
        }
        sections[current] ||= [];
        sections[current].push(line);
    }
    return sections;
}

function identifySection(line) {
    if (!line) return '';
    const normalized = normalizeComparable(line.replace(/:$/, ''));
    if (normalized.split(' ').length > HEADING_WORD_LIMIT) return '';
    for (const [section, aliases] of Object.entries(SECTION_ALIASES)) {
        if (aliases.includes(normalized)) return section;
    }
    return '';
}

function splitEntryBlocks(lines) {
    const blocks = [];
    let current = [];
    const flush = () => {
        const cleaned = current.map(cleanValue).filter(Boolean);
        if (cleaned.length) blocks.push(cleaned);
        current = [];
    };

    for (const line of lines) {
        if (!line) {
            flush();
            continue;
        }
        if (current.length && hasDateRange(line) && current.some(hasDateRange)) flush();
        current.push(line);
    }
    flush();
    return blocks;
}

function splitPublicationEntries(lines) {
    const blocks = [];
    let current = [];
    const flush = () => {
        const cleaned = current.map(cleanValue).filter(Boolean);
        if (cleaned.length) blocks.push(cleaned);
        current = [];
    };

    for (const line of lines) {
        if (!line) {
            flush();
            continue;
        }
        const numbered = /^\s*(?:\[?\d+\]?|[A-Z])\s*[.)]\s+/.test(line);
        const standaloneCitation = !numbered && line.length > 45 && /\b(?:19|20)\d{2}\b|10\.\d{4,9}\//i.test(line);
        if (current.length && (numbered || standaloneCitation)) flush();
        current.push(line);
    }
    flush();
    return blocks;
}

function findName(lines, entities) {
    const personEntities = entityValues(entities, 'PER');
    const candidates = lines
        .map((line, index) => ({ line, index, score: scoreName(line, index, personEntities) }))
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score || left.index - right.index);
    return candidates[0]?.line || personEntities[0] || '';
}

function scoreName(line, index, personEntities) {
    if (!line || line.length > 90 || /[@\d:/]|curriculum|resume|vitae|university|institute/i.test(line)) return -1;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 7 || words.some((word) => !/^(?:Dr\.?|Prof\.?)?[\p{L}'-]+$/u.test(word))) return -1;
    let score = Math.max(0, 12 - index);
    if (words.every((word) => /^(?:Dr\.?|Prof\.?|[\p{Lu}])/u.test(word))) score += 5;
    if (personEntities.some((entity) => includesLoose(line, entity))) score += 10;
    return score;
}

function findHeadline(lines, nameIndex, name) {
    const candidates = lines.slice(Math.max(0, nameIndex + 1), Math.max(0, nameIndex + 5));
    return candidates.find((line) => (
        line !== name
        && line.length <= 120
        && !isContactLine(line)
        && !identifySection(line)
    )) || '';
}

function findLocation(lines, entities, email, phone) {
    const locations = entityValues(entities, 'LOC');
    const sourceLine = lines.find((line) => (
        line !== email
        && line !== phone
        && !isContactLine(line)
        && (looksLikeLocation(line) || locations.some((location) => includesLoose(line, location)))
    ));
    if (sourceLine) return sourceLine;
    if (locations[0]) return locations[0];
    return lines.find((line) => line !== email && line !== phone && looksLikeLocation(line)) || '';
}

function findWebsite(text) {
    const matches = text.match(/(?:https?:\/\/|www\.)[^\s,;]+/ig) || [];
    return matches.map((value) => value.replace(/[.)]+$/, '')).find((value) => !/orcid\.org|doi\.org/i.test(value)) || '';
}

function findPhone(text) {
    const matches = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g) || [];
    return matches.map(cleanValue).find((value) => value.replace(/\D/g, '').length >= 8 && !/^\d{4}[- ]\d{4}/.test(value)) || '';
}

function looksLikeLocation(line) {
    if (!line || line.length > 80 || isContactLine(line) || /\d{4}/.test(line)) return false;
    return /^[\p{L} .'-]+,\s*[\p{L} .'-]+$/u.test(line) || /\b(?:Greece|Europe|United Kingdom|United States|USA|UK)\b/i.test(line);
}

function isContactLine(line) {
    return /@|https?:|www\.|orcid|\+?\d[\d\s().-]{6,}/i.test(line);
}

function hasDateRange(value) {
    return /\b(?:19|20)\d{2}\b(?:\s*(?:-|to|until)\s*(?:present|current|(?:19|20)\d{2}))?/i.test(value);
}

function parseDateRange(value) {
    const normalized = value.replace(/[\u2012-\u2015]/g, '-');
    const range = normalized.match(/\b((?:19|20)\d{2})(?:[-/]\d{1,2})?\s*(?:-|to|until)\s*(present|current|(?:19|20)\d{2}(?:[-/]\d{1,2})?)/i);
    if (range) return { start: range[1], end: /^present|current$/i.test(range[2]) ? '' : range[2].slice(0, 4), current: /^present|current$/i.test(range[2]) };
    const years = [...normalized.matchAll(/\b(?:19|20)\d{2}\b/g)].map((match) => match[0]);
    return { start: years[0] || '', end: years[1] || years[0] || '', current: /\b(?:present|current)\b/i.test(normalized) };
}

function removeDateRange(value) {
    return value
        .replace(/[\u2012-\u2015]/g, '-')
        .replace(/\b(?:19|20)\d{2}(?:[-/]\d{1,2})?\s*(?:-|to|until)?\s*(?:present|current|(?:19|20)\d{2}(?:[-/]\d{1,2})?)?/ig, ' ')
        .replace(/^[,;|\s-]+|[,;|\s-]+$/g, ' ');
}

function toMonthValue(value) {
    if (!value) return '';
    const match = String(value).match(/^((?:19|20)\d{2})(?:[-/](\d{1,2}))?/);
    if (!match) return '';
    return `${match[1]}-${String(match[2] || '01').padStart(2, '0')}`;
}

function inferPublicationType(value) {
    if (/preprint|arxiv|bioRxiv|medRxiv/i.test(value)) return 'Preprint';
    if (/conference|proceedings|symposium|workshop/i.test(value)) return 'Conference paper';
    if (/chapter|edited volume/i.test(value)) return 'Book chapter';
    if (/thesis|dissertation/i.test(value)) return 'Thesis';
    if (/dataset|zenodo|figshare/i.test(value)) return 'Dataset';
    if (/software|github|package|library/i.test(value)) return 'Software';
    return PUBLICATION_TYPES[0];
}

function looksLikeAuthors(value = '') {
    return /,|\bet al\.?\b|\b[A-Z]\.?\s*[A-Z][\p{L}'-]+/u.test(value) && value.length < 300;
}

function splitCitationSegments(value) {
    return value
        .replace(/\b([A-Z])\.(?=\s|$)/g, '$1<INITIAL>')
        .split(/\.\s+(?=[A-Z"“])/)
        .map((part) => part.replaceAll('<INITIAL>', '.').trim())
        .filter(Boolean);
}

function entityValues(entities, type) {
    return entities
        .filter((entity) => entity?.type === type && Number(entity.score || 0) >= 0.55)
        .map((entity) => cleanValue(entity.text))
        .filter(Boolean);
}

function describeCollectionItem(collection, item) {
    if (collection === 'positions') return item.role || item.institution || 'Academic position';
    if (collection === 'education') return [item.degree, item.field].filter(Boolean).join(' in ') || item.institution || 'Education';
    if (collection === 'publications') return item.title || 'Publication';
    if (collection === 'awards') return item.title || 'Award';
    if (collection === 'skills') return PROGRAMMING_LANGUAGES.find((language) => language.key === item.key)?.label || item.key;
    return 'Imported item';
}

function describeCollectionDetails(collection, item) {
    if (collection === 'positions') return compact([item.institution, item.start && `${item.start} to ${item.current ? 'Present' : item.end}`].filter(Boolean).join(' | '), 180);
    if (collection === 'education') return compact([item.institution, item.endYear].filter(Boolean).join(' | '), 180);
    if (collection === 'publications') return compact([item.authors, item.venue, item.year].filter(Boolean).join(' | '), 220);
    if (collection === 'awards') return compact([item.issuer, item.year].filter(Boolean).join(' | '), 180);
    if (collection === 'skills') return item.level || 'Proficient';
    return '';
}

function collectionIdentity(collection, item) {
    if (collection === 'skills') return normalizeComparable(item.key);
    if (collection === 'publications') return normalizeComparable(item.doi || item.title);
    if (collection === 'positions') return normalizeComparable(`${item.role}|${item.institution}|${item.start}`);
    if (collection === 'education') return normalizeComparable(`${item.degree}|${item.institution}|${item.endYear}`);
    if (collection === 'awards') return normalizeComparable(`${item.title}|${item.issuer}|${item.year}`);
    return normalizeComparable(JSON.stringify(item));
}

function hasVisibleValue(item) {
    return Object.entries(item || {}).some(([key, value]) => !['id', 'featured', 'current'].includes(key) && cleanValue(value));
}

function normalizeText(value) {
    return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[\t ]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function cleanValue(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function compactParagraph(value, limit) {
    return compact(cleanValue(value), limit);
}

function compact(value, limit) {
    const text = cleanValue(value);
    return text.length <= limit ? text : `${text.slice(0, limit - 3).trim()}...`;
}

function normalizeComparable(value) {
    return cleanValue(value).toLowerCase().replace(/[^a-z0-9\p{L}]+/gu, ' ').trim();
}

function includesLoose(value, expected) {
    const left = normalizeComparable(value);
    const right = normalizeComparable(expected);
    return Boolean(right && (left.includes(right) || right.includes(left)));
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function structuredCloneSafe(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function createId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
