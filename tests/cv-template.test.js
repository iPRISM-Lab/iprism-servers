import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyProfile, renderCvHtml } from '../supabase/functions/_shared/cv-template.js';

test('renders escaped profile content without executable scripts', () => {
    const profile = createEmptyProfile('ada-lovelace');
    profile.personal.name = '<script>alert(1)</script> Ada';
    profile.personal.summary = 'Research & development';
    profile.personal.website = 'javascript:alert(1)';

    const html = renderCvHtml(profile);

    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; Ada/);
    assert.match(html, /Research &amp; development/);
    assert.doesNotMatch(html, /href="javascript:/);
    assert.doesNotMatch(html, /<script>/);
});

test('renders academic sections, publications, and programming icons', () => {
    const profile = createEmptyProfile('grace-hopper');
    profile.personal.name = 'Grace Hopper';
    profile.positions.push({ role: 'Professor', institution: 'Example University', start: '2020-01', current: true });
    profile.education.push({ degree: 'PhD', field: 'Computer Science', institution: 'Example Institute', endYear: '2019' });
    profile.publications.push({ type: 'Journal article', title: 'A useful paper', year: '2025', doi: '10.1000/example', featured: true });
    profile.skills.push({ key: 'python', level: 'Expert' });
    profile.skills.push({ key: 'matlab', level: 'Advanced' });

    const html = renderCvHtml(profile, { photoUrl: './profile.jpg' });

    assert.match(html, /Academic appointments/);
    assert.match(html, /Selected publications/);
    assert.match(html, /https:\/\/doi.org\/10.1000\/example/);
    assert.match(html, /cdn.simpleicons.org\/python\/3776AB/);
    assert.match(html, /cdn.jsdelivr.net\/gh\/devicons\/devicon@v2.17.0\/icons\/matlab\/matlab-original.svg/);
    assert.match(html, /img-src[^";]*https:\/\/cdn.jsdelivr.net/);
    assert.match(html, /src="\.\/profile.jpg"/);
});
