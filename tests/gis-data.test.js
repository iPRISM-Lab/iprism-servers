import test from 'node:test';
import assert from 'node:assert/strict';
import { GIS_BRANCHES, findGisNodeById, getGisLeafNodes } from '../gis-data.js';

test('exposes the five requested GIS branches in the reference order', () => {
    assert.deepEqual(
        GIS_BRANCHES.map((branch) => branch.label),
        ['Definition', 'Components', 'Issues', 'Trends', 'Applications']
    );
    assert.deepEqual(
        GIS_BRANCHES.map((branch) => branch.side),
        ['left', 'left', 'left', 'right', 'right']
    );
});

test('gives every GIS node a unique path-based identifier', () => {
    const ids = [];
    const stack = [...GIS_BRANCHES];
    while (stack.length) {
        const node = stack.pop();
        ids.push(node.id);
        stack.push(...(node.children || []));
    }

    assert.equal(new Set(ids).size, ids.length);
    ids.forEach((id) => assert.equal(findGisNodeById(id)?.id, id));
});

test('gives every terminal GIS branch explanatory copy and official web sources', () => {
    const leaves = getGisLeafNodes();
    assert.ok(leaves.length >= 60);

    leaves.forEach((leaf) => {
        assert.ok(leaf.summary.length >= 60, `${leaf.label} needs a substantive explanation`);
        assert.ok(leaf.sources.length >= 1, `${leaf.label} needs at least one source`);
        leaf.sources.forEach((source) => {
            assert.ok(source.label.length > 3);
            assert.match(source.href, /^https:\/\//);
        });
    });
});

test('marks the retired ArcGIS Explorer branch with its supported successor', () => {
    const explorer = getGisLeafNodes().find((leaf) => leaf.label === 'ArcGIS Explorer');
    assert.ok(explorer);
    assert.match(explorer.status, /Retired product/);
    assert.ok(explorer.sources.some((source) => /Field Maps/.test(source.label)));
});
