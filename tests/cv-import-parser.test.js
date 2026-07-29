import test from 'node:test';
import assert from 'node:assert/strict';
import { applyImportReview, buildImportReview, parseCvText } from '../cv-import-parser.js';
import { createEmptyProfile } from '../supabase/functions/_shared/cv-template.js';

const sampleCv = `
Dr Ada Lovelace
Researcher in computational science
London, United Kingdom
ada@example.org | +44 20 1234 5678
https://ada.example.org
ORCID: 0000-0001-2345-678X

Professional Summary
I study analytical engines and scientific computing.

Academic Appointments
Professor of Computing
Example University
2021 - Present

Research Fellow
Analytical Institute
2018 - 2021

Education
PhD in Computer Science
University of London
2014 - 2018

Publications
1. A. Lovelace, C. Babbage. "Notes on the Analytical Engine." Journal of Computing, 2024. doi:10.1000/example
2. A. Lovelace. Reproducible algorithms for research. Proceedings of Example Conference, 2022.

Programming Languages
Python, C++, JavaScript, SQL

Awards
Scientific Computing Prize
Royal Example Society
2023
`;

test('parses a conventional academic CV into the builder schema', () => {
    const profile = parseCvText(sampleCv, [
        { type: 'PER', text: 'Ada Lovelace', score: 0.99 },
        { type: 'LOC', text: 'London', score: 0.97 },
        { type: 'ORG', text: 'Example University', score: 0.98 }
    ]);

    assert.equal(profile.personal.name, 'Dr Ada Lovelace');
    assert.equal(profile.personal.email, 'ada@example.org');
    assert.equal(profile.personal.orcid, '0000-0001-2345-678X');
    assert.equal(profile.personal.location, 'London, United Kingdom');
    assert.equal(profile.positions.length, 2);
    assert.equal(profile.positions[0].current, true);
    assert.equal(profile.education[0].degree, 'PhD');
    assert.equal(profile.education[0].field, 'Computer Science');
    assert.equal(profile.publications.length, 2);
    assert.equal(profile.publications[0].doi, '10.1000/example');
    assert.deepEqual(profile.skills.map((skill) => skill.key), ['python', 'javascript', 'cpp', 'sql']);
    assert.equal(profile.awards[0].year, '2023');
});

test('review defaults protect populated personal fields and append collections', () => {
    const current = createEmptyProfile('ada-lovelace');
    current.personal.name = 'Existing Name';
    const imported = parseCvText(sampleCv);
    const review = buildImportReview(current, imported);
    const nameCandidate = review.find((candidate) => candidate.key === 'personal.name');
    const publicationCandidate = review.find((candidate) => candidate.key === 'publications.0');

    assert.equal(nameCandidate.selected, false);
    assert.equal(publicationCandidate.selected, true);

    const selected = new Set(review.filter((candidate) => candidate.selected).map((candidate) => candidate.key));
    const merged = applyImportReview(current, imported, selected);
    assert.equal(merged.personal.name, 'Existing Name');
    assert.equal(merged.personal.email, 'ada@example.org');
    assert.equal(merged.publications.length, 2);
});

test('review does not add duplicate publications or programming languages', () => {
    const imported = parseCvText(sampleCv);
    const current = createEmptyProfile('ada-lovelace');
    current.publications.push({ ...imported.publications[0] });
    current.skills.push({ ...imported.skills[0] });

    const keys = buildImportReview(current, imported).map((candidate) => candidate.key);
    assert.equal(keys.includes('publications.0'), false);
    assert.equal(keys.includes('skills.0'), false);
});
