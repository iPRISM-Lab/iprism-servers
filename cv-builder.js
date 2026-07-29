import {
    PROGRAMMING_LANGUAGES,
    PUBLICATION_TYPES,
    createEmptyProfile,
    escapeHtml,
    normalizeProfile,
    renderCvHtml
} from './supabase/functions/_shared/cv-template.js';

const PHOTO_BUCKET = 'cv-photos';
const SAVE_DELAY_MS = 850;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const collectionDefaults = {
    positions: () => ({ id: createId(), role: '', institution: '', location: '', start: '', end: '', current: false, summary: '' }),
    education: () => ({ id: createId(), degree: '', field: '', institution: '', startYear: '', endYear: '', details: '' }),
    publications: () => ({ id: createId(), type: PUBLICATION_TYPES[0], title: '', authors: '', venue: '', year: String(new Date().getFullYear()), doi: '', url: '', featured: false }),
    awards: () => ({ id: createId(), title: '', issuer: '', year: String(new Date().getFullYear()), description: '' }),
    skills: () => ({ id: createId(), key: PROGRAMMING_LANGUAGES[0].key, level: 'Proficient' })
};

let builder = null;

export async function mountCvBuilder(container, options) {
    unmountCvBuilder();
    const instance = {
        container,
        supabase: options.supabase,
        session: options.session,
        baseDomain: String(options.baseDomain || '').trim().toLowerCase(),
        activeTab: 'personal',
        profile: createDefaultProfile(options.session?.user),
        record: null,
        photoUrl: '',
        objectPhotoUrl: '',
        saveTimer: null,
        saving: false,
        savePromise: null,
        publishing: false,
        dirty: false,
        revision: 0,
        notice: { text: 'Loading draft', tone: 'muted' }
    };
    builder = instance;
    renderLoading(instance);

    try {
        const { data, error } = await instance.supabase
            .from('cv_profiles')
            .select('slug, content, publication_status, published_url, github_repository, last_published_at, updated_at')
            .eq('user_id', instance.session.user.id)
            .maybeSingle();

        if (builder !== instance) return;
        if (error) throw error;

        if (data) {
            instance.record = data;
            instance.profile = normalizeProfile({ ...data.content, slug: data.slug });
        }

        if (instance.profile.personal.photoPath) {
            const { data: signedPhoto } = await instance.supabase.storage
                .from(PHOTO_BUCKET)
                .createSignedUrl(instance.profile.personal.photoPath, 3600);
            if (builder !== instance) return;
            instance.photoUrl = signedPhoto?.signedUrl || '';
        }

        instance.notice = { text: data ? 'Draft loaded' : 'New draft', tone: 'success' };
    } catch (error) {
        console.error('CV draft could not be loaded:', error);
        instance.notice = { text: getDraftErrorMessage(error, 'Draft storage is not configured'), tone: 'error' };
    }

    if (builder === instance) renderBuilder(instance);
}

export function unmountCvBuilder() {
    if (!builder) return;
    window.clearTimeout(builder.saveTimer);
    if (builder.objectPhotoUrl) URL.revokeObjectURL(builder.objectPhotoUrl);
    builder = null;
}

export async function handleCvClick(event) {
    if (!builder || !builder.container.isConnected) return false;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return false;
    const actionNode = target.closest('[data-cv-action]');
    if (!(actionNode instanceof HTMLElement) || !builder.container.contains(actionNode)) return false;

    event.preventDefault();
    const action = actionNode.dataset.cvAction;

    if (action === 'tab') {
        builder.activeTab = actionNode.dataset.tab || 'personal';
        syncTabs(builder);
        renderEditor(builder);
        return true;
    }

    if (action === 'add') {
        const collection = actionNode.dataset.collection;
        if (collection && collectionDefaults[collection]) {
            builder.profile[collection].push(collectionDefaults[collection]());
            markDirty(builder);
            renderEditor(builder);
            refreshPreview(builder);
        }
        return true;
    }

    if (action === 'remove') {
        const collection = actionNode.dataset.collection;
        const index = Number(actionNode.dataset.index);
        if (collection && Array.isArray(builder.profile[collection]) && Number.isInteger(index)) {
            builder.profile[collection].splice(index, 1);
            markDirty(builder);
            renderEditor(builder);
            refreshPreview(builder);
        }
        return true;
    }

    if (action === 'save') {
        await saveDraft(builder, { announce: true });
        return true;
    }

    if (action === 'publish') {
        await publishCv(builder);
        return true;
    }

    if (action === 'remove-photo') {
        await removePhoto(builder);
        return true;
    }

    return false;
}

export function handleCvInput(event) {
    if (!builder || !builder.container.isConnected) return false;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
    if (!builder.container.contains(target) || !target.dataset.cvBind || ['checkbox', 'file'].includes(target.type)) return false;

    const value = target.dataset.cvBind === 'slug' ? sanitizeSlug(target.value) : target.value;
    if (target.dataset.cvBind === 'slug' && target.value !== value) target.value = value;
    setAtPath(builder.profile, target.dataset.cvBind, value);
    markDirty(builder);
    refreshPreview(builder);
    updateDomainLabel(builder);
    return true;
}

export async function handleCvChange(event) {
    if (!builder || !builder.container.isConnected) return false;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return false;
    if (!builder.container.contains(target)) return false;

    if (target instanceof HTMLInputElement && target.type === 'file' && target.dataset.cvPhoto !== undefined) {
        await uploadPhoto(builder, target.files?.[0]);
        return true;
    }

    const path = target.dataset.cvBind;
    if (!path) return false;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setAtPath(builder.profile, path, value);
    markDirty(builder);
    refreshPreview(builder);
    if (target instanceof HTMLSelectElement && path.startsWith('skills.')) renderEditor(builder);
    return true;
}

function createDefaultProfile(user) {
    const suggestedSlug = sanitizeSlug(user?.user_metadata?.user_name || user?.email?.split('@')[0] || 'my-cv');
    const profile = createEmptyProfile(suggestedSlug.length >= 3 ? suggestedSlug : `${suggestedSlug || 'cv'}-profile`);
    profile.personal.name = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    profile.personal.email = user?.email || '';
    return profile;
}

function renderLoading(instance) {
    instance.container.innerHTML = `
        <div class="cv-builder-loading glass">
            <span class="cv-spinner" aria-hidden="true"></span>
            <strong>Loading CV builder</strong>
        </div>
    `;
}

function renderBuilder(instance) {
    const publishedUrl = instance.record?.published_url || '';
    instance.container.innerHTML = `
        <div class="cv-builder-page">
            <header class="cv-builder-header">
                <div>
                    <span class="cv-builder-kicker">Profile publishing</span>
                    <h1>CV Builder</h1>
                </div>
                <div class="cv-builder-actions">
                    <span class="cv-save-state cv-save-state-${escapeHtml(instance.notice.tone)}" data-cv-status>${escapeHtml(instance.notice.text)}</span>
                    <button type="button" class="cv-button cv-button-secondary" data-cv-action="save">
                        <span aria-hidden="true">&#10003;</span> Save
                    </button>
                    <button type="button" class="cv-button cv-button-primary" data-cv-action="publish" ${instance.publishing ? 'disabled' : ''}>
                        <span aria-hidden="true">&#8593;</span> ${instance.publishing ? 'Publishing' : 'Publish CV'}
                    </button>
                </div>
            </header>
            <div class="cv-domain-strip">
                <div>
                    <span>Public address</span>
                    <strong data-cv-domain>${escapeHtml(formatDomain(instance))}</strong>
                </div>
                ${publishedUrl ? `<a href="${escapeHtml(publishedUrl)}" target="_blank" rel="noopener noreferrer">Open published CV <span aria-hidden="true">&#8599;</span></a>` : '<span class="cv-domain-state">Not published</span>'}
            </div>
            <div class="cv-builder-workspace">
                <section class="cv-editor-pane" aria-label="CV editor">
                    <div class="cv-tabs" role="tablist" aria-label="CV sections">
                        ${renderTab('personal', 'Personal', instance.activeTab)}
                        ${renderTab('academic', 'Academic', instance.activeTab)}
                        ${renderTab('publications', 'Publications', instance.activeTab)}
                        ${renderTab('skills', 'Skills & awards', instance.activeTab)}
                    </div>
                    <div class="cv-editor-content" data-cv-editor></div>
                </section>
                <section class="cv-preview-pane" aria-label="CV preview">
                    <div class="cv-preview-toolbar">
                        <strong>Live preview</strong>
                        <span>Preview</span>
                    </div>
                    <iframe class="cv-preview-frame" data-cv-preview title="CV preview"></iframe>
                </section>
            </div>
        </div>
    `;
    renderEditor(instance);
    refreshPreview(instance);
}

function renderTab(id, label, activeTab) {
    return `<button type="button" role="tab" aria-selected="${id === activeTab}" class="cv-tab ${id === activeTab ? 'active' : ''}" data-cv-action="tab" data-tab="${id}">${escapeHtml(label)}</button>`;
}

function renderEditor(instance) {
    const container = instance.container.querySelector('[data-cv-editor]');
    if (!container) return;
    const renderers = {
        personal: renderPersonalForm,
        academic: renderAcademicForm,
        publications: renderPublicationsForm,
        skills: renderSkillsForm
    };
    container.innerHTML = (renderers[instance.activeTab] || renderPersonalForm)(instance.profile, instance);
}

function syncTabs(instance) {
    instance.container.querySelectorAll('[data-cv-action="tab"]').forEach((tab) => {
        const active = tab.dataset.tab === instance.activeTab;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
}

function renderPersonalForm(profile, instance) {
    const personal = profile.personal;
    return `
        <div class="cv-form-section">
            <div class="cv-section-heading"><div><span>Identity</span><h2>Personal details</h2></div></div>
            <div class="cv-photo-row">
                <div class="cv-photo-thumb">${instance.photoUrl ? `<img src="${escapeHtml(instance.photoUrl)}" alt="Profile preview">` : `<span>${escapeHtml(getInitials(personal.name))}</span>`}</div>
                <div class="cv-photo-actions">
                    <label class="cv-button cv-button-secondary cv-upload-button"><span aria-hidden="true">&#8593;</span> Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" data-cv-photo></label>
                    ${personal.photoPath ? `<button type="button" class="cv-icon-button" data-cv-action="remove-photo" title="Remove profile photo" aria-label="Remove profile photo">&times;</button>` : ''}
                </div>
            </div>
            <div class="cv-field-grid">
                ${textField('Full name', 'personal.name', personal.name, { required: true, wide: true, placeholder: 'Dr Ada Lovelace' })}
                ${textField('Professional headline', 'personal.headline', personal.headline, { wide: true, placeholder: 'Researcher in computational science' })}
                ${textField('Email', 'personal.email', personal.email, { type: 'email' })}
                ${textField('Phone', 'personal.phone', personal.phone, { type: 'tel' })}
                ${textField('Location', 'personal.location', personal.location, { placeholder: 'Athens, Greece' })}
                ${textField('Website', 'personal.website', personal.website, { type: 'url', placeholder: 'example.org' })}
                ${textField('ORCID', 'personal.orcid', personal.orcid, { placeholder: '0000-0000-0000-0000' })}
                ${textField('Subdomain', 'slug', profile.slug, { placeholder: 'ada-lovelace' })}
                ${textareaField('Professional summary', 'personal.summary', personal.summary, { wide: true, rows: 5 })}
            </div>
            <div class="cv-checkbox-row">
                ${checkboxField('Show email publicly', 'personal.showEmail', personal.showEmail)}
                ${checkboxField('Show phone publicly', 'personal.showPhone', personal.showPhone)}
            </div>
        </div>
    `;
}

function renderAcademicForm(profile) {
    return `
        <div class="cv-form-section">
            ${sectionHeader('Appointments', 'Academic positions', 'positions')}
            <div class="cv-repeat-list">
                ${profile.positions.length ? profile.positions.map(renderPosition).join('') : renderEmptyState('No academic positions added')}
            </div>
        </div>
        <div class="cv-form-section">
            ${sectionHeader('Qualifications', 'Education', 'education')}
            <div class="cv-repeat-list">
                ${profile.education.length ? profile.education.map(renderEducation).join('') : renderEmptyState('No education added')}
            </div>
        </div>
    `;
}

function renderPublicationsForm(profile) {
    return `
        <div class="cv-form-section">
            ${sectionHeader('Research output', 'Publications', 'publications')}
            <div class="cv-repeat-list">
                ${profile.publications.length ? profile.publications.map(renderPublication).join('') : renderEmptyState('No publications added')}
            </div>
        </div>
    `;
}

function renderSkillsForm(profile) {
    return `
        <div class="cv-form-section">
            ${sectionHeader('Technical profile', 'Programming languages', 'skills')}
            <div class="cv-repeat-list cv-skill-editor-list">
                ${profile.skills.length ? profile.skills.map(renderSkillEditor).join('') : renderEmptyState('No programming languages added')}
            </div>
        </div>
        <div class="cv-form-section">
            ${sectionHeader('Recognition', 'Awards', 'awards')}
            <div class="cv-repeat-list">
                ${profile.awards.length ? profile.awards.map(renderAward).join('') : renderEmptyState('No awards added')}
            </div>
        </div>
    `;
}

function sectionHeader(kicker, title, collection) {
    return `
        <div class="cv-section-heading">
            <div><span>${escapeHtml(kicker)}</span><h2>${escapeHtml(title)}</h2></div>
            <button type="button" class="cv-button cv-button-secondary" data-cv-action="add" data-collection="${collection}"><span aria-hidden="true">&#43;</span> Add</button>
        </div>
    `;
}

function renderPosition(item, index) {
    return `
        <article class="cv-repeat-item">
            ${removeButton('positions', index, 'Remove academic position')}
            <div class="cv-field-grid">
                ${textField('Role / title', `positions.${index}.role`, item.role, { wide: true, placeholder: 'Assistant Professor' })}
                ${textField('Institution', `positions.${index}.institution`, item.institution)}
                ${textField('Location', `positions.${index}.location`, item.location)}
                ${textField('Start', `positions.${index}.start`, item.start, { type: 'month' })}
                ${textField('End', `positions.${index}.end`, item.end, { type: 'month' })}
                ${textareaField('Description', `positions.${index}.summary`, item.summary, { wide: true, rows: 3 })}
            </div>
            <div class="cv-checkbox-row">${checkboxField('Current position', `positions.${index}.current`, item.current)}</div>
        </article>
    `;
}

function renderEducation(item, index) {
    return `
        <article class="cv-repeat-item">
            ${removeButton('education', index, 'Remove education')}
            <div class="cv-field-grid">
                ${textField('Degree', `education.${index}.degree`, item.degree, { placeholder: 'PhD' })}
                ${textField('Field', `education.${index}.field`, item.field, { placeholder: 'Computer Science' })}
                ${textField('Institution', `education.${index}.institution`, item.institution, { wide: true })}
                ${yearField('Start year', `education.${index}.startYear`, item.startYear)}
                ${yearField('End year', `education.${index}.endYear`, item.endYear)}
                ${textareaField('Details', `education.${index}.details`, item.details, { wide: true, rows: 3 })}
            </div>
        </article>
    `;
}

function renderPublication(item, index) {
    return `
        <article class="cv-repeat-item">
            ${removeButton('publications', index, 'Remove publication')}
            <div class="cv-field-grid">
                ${selectField('Type', `publications.${index}.type`, item.type, PUBLICATION_TYPES.map((type) => ({ value: type, label: type })))}
                ${yearField('Year', `publications.${index}.year`, item.year)}
                ${textField('Title', `publications.${index}.title`, item.title, { wide: true, placeholder: 'Publication title' })}
                ${textField('Authors', `publications.${index}.authors`, item.authors, { wide: true, placeholder: 'A. Author, B. Researcher' })}
                ${textField('Journal / venue', `publications.${index}.venue`, item.venue, { wide: true })}
                ${textField('DOI', `publications.${index}.doi`, item.doi, { placeholder: '10.1000/example' })}
                ${textField('URL', `publications.${index}.url`, item.url, { type: 'url' })}
            </div>
            <div class="cv-checkbox-row">${checkboxField('Feature publication', `publications.${index}.featured`, item.featured)}</div>
        </article>
    `;
}

function renderSkillEditor(item, index) {
    const language = PROGRAMMING_LANGUAGES.find((entry) => entry.key === item.key) || PROGRAMMING_LANGUAGES[0];
    return `
        <article class="cv-repeat-item cv-skill-editor">
            <img src="https://cdn.simpleicons.org/${language.icon}/${language.color}" alt="" aria-hidden="true">
            ${selectField('Language', `skills.${index}.key`, item.key, PROGRAMMING_LANGUAGES.map((entry) => ({ value: entry.key, label: entry.label })))}
            ${selectField('Proficiency', `skills.${index}.level`, item.level, ['Familiar', 'Proficient', 'Advanced', 'Expert'].map((level) => ({ value: level, label: level })))}
            ${removeButton('skills', index, 'Remove programming language')}
        </article>
    `;
}

function renderAward(item, index) {
    return `
        <article class="cv-repeat-item">
            ${removeButton('awards', index, 'Remove award')}
            <div class="cv-field-grid">
                ${textField('Award', `awards.${index}.title`, item.title, { wide: true })}
                ${textField('Issuer', `awards.${index}.issuer`, item.issuer)}
                ${yearField('Year', `awards.${index}.year`, item.year)}
                ${textareaField('Description', `awards.${index}.description`, item.description, { wide: true, rows: 3 })}
            </div>
        </article>
    `;
}

function textField(label, path, value, options = {}) {
    return `
        <label class="cv-field ${options.wide ? 'cv-field-wide' : ''}">
            <span>${escapeHtml(label)}${options.required ? ' <b aria-hidden="true">*</b>' : ''}</span>
            <input type="${options.type || 'text'}" value="${escapeHtml(value || '')}" data-cv-bind="${escapeHtml(path)}" ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''} ${options.required ? 'required' : ''}>
        </label>
    `;
}

function textareaField(label, path, value, options = {}) {
    return `
        <label class="cv-field ${options.wide ? 'cv-field-wide' : ''}">
            <span>${escapeHtml(label)}</span>
            <textarea rows="${options.rows || 3}" data-cv-bind="${escapeHtml(path)}">${escapeHtml(value || '')}</textarea>
        </label>
    `;
}

function selectField(label, path, value, options) {
    return `
        <label class="cv-field">
            <span>${escapeHtml(label)}</span>
            <select data-cv-bind="${escapeHtml(path)}">
                ${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
            </select>
        </label>
    `;
}

function yearField(label, path, value) {
    const currentYear = new Date().getFullYear();
    const years = [{ value: '', label: 'Select year' }];
    for (let year = currentYear + 2; year >= 1940; year -= 1) years.push({ value: String(year), label: String(year) });
    return selectField(label, path, String(value || ''), years);
}

function checkboxField(label, path, checked) {
    return `
        <label class="cv-checkbox">
            <input type="checkbox" data-cv-bind="${escapeHtml(path)}" ${checked ? 'checked' : ''}>
            <span aria-hidden="true"></span>
            <b>${escapeHtml(label)}</b>
        </label>
    `;
}

function removeButton(collection, index, label) {
    return `<button type="button" class="cv-icon-button cv-remove-button" data-cv-action="remove" data-collection="${collection}" data-index="${index}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">&times;</button>`;
}

function renderEmptyState(text) {
    return `<div class="cv-empty-state">${escapeHtml(text)}</div>`;
}

function refreshPreview(instance) {
    const frame = instance.container.querySelector('[data-cv-preview]');
    if (frame instanceof HTMLIFrameElement) {
        frame.srcdoc = renderCvHtml(instance.profile, { preview: true, photoUrl: instance.photoUrl });
    }
}

function updateDomainLabel(instance) {
    const label = instance.container.querySelector('[data-cv-domain]');
    if (label) label.textContent = formatDomain(instance);
}

function formatDomain(instance) {
    const slug = instance.profile.slug || 'your-name';
    return instance.baseDomain ? `${slug}.${instance.baseDomain}` : `${slug}.cv.example.org`;
}

function markDirty(instance) {
    instance.dirty = true;
    instance.revision += 1;
    setNotice(instance, 'Unsaved changes', 'muted');
    window.clearTimeout(instance.saveTimer);
    instance.saveTimer = window.setTimeout(() => void saveDraft(instance), SAVE_DELAY_MS);
}

async function saveDraft(instance, options = {}) {
    if (builder !== instance) return false;
    if (instance.savePromise) {
        await instance.savePromise;
        if (builder !== instance || !instance.dirty) return builder === instance;
    }
    window.clearTimeout(instance.saveTimer);

    const validation = validateProfile(instance.profile, false);
    if (!validation.ok) {
        setNotice(instance, validation.message, 'error');
        return false;
    }

    instance.saving = true;
    const saveRevision = instance.revision;
    setNotice(instance, 'Saving', 'muted');
    const saveOperation = (async () => {
        const payload = {
            user_id: instance.session.user.id,
            slug: instance.profile.slug,
            content: instance.profile,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await instance.supabase
            .from('cv_profiles')
            .upsert(payload, { onConflict: 'user_id' })
            .select('slug, content, publication_status, published_url, github_repository, last_published_at, updated_at')
            .single();

        if (builder !== instance) return false;
        if (error) {
            console.error('CV draft could not be saved:', error);
            const message = getDraftErrorMessage(error, 'Draft could not be saved');
            setNotice(instance, message, 'error');
            return false;
        }

        instance.record = data;
        instance.dirty = instance.revision !== saveRevision;
        setNotice(
            instance,
            instance.dirty ? 'Unsaved changes' : (options.announce ? 'Draft saved' : 'Saved'),
            instance.dirty ? 'muted' : 'success'
        );
        return true;
    })();
    const trackedPromise = saveOperation.finally(() => {
        if (instance.savePromise === trackedPromise) {
            instance.saving = false;
            instance.savePromise = null;
        }
    });
    instance.savePromise = trackedPromise;
    return await trackedPromise;
}

async function publishCv(instance) {
    if (instance.publishing) return;
    const validation = validateProfile(instance.profile, true);
    if (!validation.ok) {
        setNotice(instance, validation.message, 'error');
        return;
    }

    const saved = await saveDraft(instance);
    if (!saved) return;

    instance.publishing = true;
    setNotice(instance, 'Publishing to GitHub Pages', 'muted');
    renderPublishButton(instance);

    const { data, error } = await instance.supabase.functions.invoke('publish-cv', {
        body: { expectedSlug: instance.profile.slug }
    });

    instance.publishing = false;
    if (builder !== instance) return;

    if (error || data?.error) {
        const message = data?.error || await getFunctionErrorMessage(error) || 'Publishing failed';
        console.error('CV publish failed:', error || data.error);
        setNotice(instance, message, 'error');
        renderPublishButton(instance);
        return;
    }

    instance.record = {
        ...instance.record,
        publication_status: data.status || 'published',
        published_url: data.url,
        github_repository: data.repository,
        last_published_at: new Date().toISOString()
    };
    instance.notice = { text: 'Published', tone: 'success' };
    renderBuilder(instance);
}

function renderPublishButton(instance) {
    const button = instance.container.querySelector('[data-cv-action="publish"]');
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = instance.publishing;
    button.innerHTML = `<span aria-hidden="true">&#8593;</span> ${instance.publishing ? 'Publishing' : 'Publish CV'}`;
}

async function uploadPhoto(instance, file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        setNotice(instance, 'Use a JPG, PNG, or WebP image under 5 MB', 'error');
        return;
    }

    setNotice(instance, 'Uploading photo', 'muted');
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = `${instance.session.user.id}/profile.${extension}`;
    const previousPath = instance.profile.personal.photoPath;
    const { error } = await instance.supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true
    });

    if (error) {
        console.error('Profile photo could not be uploaded:', error);
        setNotice(instance, 'Photo upload failed', 'error');
        return;
    }

    if (previousPath && previousPath !== path) await instance.supabase.storage.from(PHOTO_BUCKET).remove([previousPath]);
    if (instance.objectPhotoUrl) URL.revokeObjectURL(instance.objectPhotoUrl);
    instance.objectPhotoUrl = URL.createObjectURL(file);
    instance.photoUrl = instance.objectPhotoUrl;
    instance.profile.personal.photoPath = path;
    markDirty(instance);
    renderEditor(instance);
    refreshPreview(instance);
    await saveDraft(instance);
}

async function removePhoto(instance) {
    const path = instance.profile.personal.photoPath;
    if (path) {
        const { error } = await instance.supabase.storage.from(PHOTO_BUCKET).remove([path]);
        if (error) {
            setNotice(instance, 'Photo could not be removed', 'error');
            return;
        }
    }
    if (instance.objectPhotoUrl) URL.revokeObjectURL(instance.objectPhotoUrl);
    instance.objectPhotoUrl = '';
    instance.photoUrl = '';
    instance.profile.personal.photoPath = '';
    markDirty(instance);
    renderEditor(instance);
    refreshPreview(instance);
}

function validateProfile(profile, forPublish) {
    if (!SLUG_PATTERN.test(profile.slug)) return { ok: false, message: 'Subdomain must be 3-40 lowercase letters, numbers, or hyphens' };
    if (forPublish && !String(profile.personal.name || '').trim()) return { ok: false, message: 'Full name is required before publishing' };
    return { ok: true };
}

function setNotice(instance, text, tone) {
    instance.notice = { text, tone };
    const status = instance.container.querySelector('[data-cv-status]');
    if (!status) return;
    status.textContent = text;
    status.className = `cv-save-state cv-save-state-${tone}`;
}

function setAtPath(object, path, value) {
    const keys = path.split('.');
    let current = object;
    keys.slice(0, -1).forEach((key) => {
        current = current[key];
    });
    current[keys.at(-1)] = value;
}

function sanitizeSlug(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+/, '')
        .slice(0, 40);
}

function getInitials(name) {
    return String(name || 'CV')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'CV';
}

function createId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function getFunctionErrorMessage(error) {
    try {
        const body = await error?.context?.clone?.().json();
        return body?.error || '';
    } catch {
        return '';
    }
}

function getDraftErrorMessage(error, fallback) {
    if (error?.code === 'PGRST205' || String(error?.message || '').includes('cv_profiles')) {
        return 'CV storage migration has not been applied';
    }
    if (error?.code === '23505') {
        return 'That subdomain is already reserved';
    }
    if (error?.code === '42501') {
        return 'CV storage permissions are not configured';
    }
    return fallback;
}
