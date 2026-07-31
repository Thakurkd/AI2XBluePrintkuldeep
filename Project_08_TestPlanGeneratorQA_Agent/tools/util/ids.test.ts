/** Id assignment and coverage. Run: node --import tsx tools/util/ids.test.ts */
import assert from 'node:assert/strict';
import { assignIds, coverageGaps } from './ids.js';
import { WorkItem } from '../../server/types.js';

let passed = 0;
function test(name: string, fn: () => void) {
    try {
        fn();
        passed++;
        console.log(`  ok   ${name}`);
    } catch (error) {
        console.error(`  FAIL ${name}`);
        console.error(`       ${(error as Error).message.split('\n')[0]}`);
        process.exitCode = 1;
    }
}

function item(key: string, criteria: string[] = []): WorkItem {
    return {
        id: '1',
        key,
        source: 'jira',
        title: `${key} title`,
        type: 'Story',
        status: 'To Do',
        priority: 'Medium',
        assignee: null,
        reporter: null,
        labels: [],
        components: [],
        description: 'desc',
        acceptanceCriteria: criteria,
        criteriaSource: criteria.length ? 'description' : 'none',
        links: [],
        url: 'https://example.atlassian.net/browse/' + key,
        fetchedAt: new Date().toISOString(),
    };
}

console.log('\nids.ts');

test('ids are sequential per work item and never duplicated', () => {
    // The real failure mode: the model numbers everything TC-001.
    const raw = [
        { workItemKey: 'SCRUM-5', title: 'a', id: 'TC-001' },
        { workItemKey: 'SCRUM-5', title: 'b', id: 'TC-001' },
        { workItemKey: 'SCRUM-6', title: 'c', id: 'TC-1' },
        { workItemKey: 'SCRUM-5', title: 'd', id: 'wrong-format' },
    ];
    const cases = assignIds(raw, [item('SCRUM-5'), item('SCRUM-6')]);

    assert.deepEqual(
        cases.map((c) => c.id),
        ['SCRUM-5-TC-001', 'SCRUM-5-TC-002', 'SCRUM-6-TC-001', 'SCRUM-5-TC-003']
    );
    assert.equal(new Set(cases.map((c) => c.id)).size, 4, 'ids must be unique');
});

test('a work-item key the model invented falls back to a real one', () => {
    const cases = assignIds([{ workItemKey: 'MADE-UP-9', title: 'x' }], [item('SCRUM-5')]);
    assert.equal(cases[0].workItemKey, 'SCRUM-5');
    assert.equal(cases[0].id, 'SCRUM-5-TC-001');
});

test('near-miss enums are coerced, not rejected', () => {
    const cases = assignIds(
        [
            { workItemKey: 'SCRUM-5', title: 'a', type: 'negative test', priority: 'critical' },
            { workItemKey: 'SCRUM-5', title: 'b', type: 'edge case', priority: 'p3' },
            { workItemKey: 'SCRUM-5', title: 'c', type: 'nonsense', priority: '' },
        ],
        [item('SCRUM-5')]
    );
    assert.equal(cases[0].type, 'Negative');
    assert.equal(cases[0].priority, 'High');
    assert.equal(cases[1].type, 'Boundary');
    assert.equal(cases[1].priority, 'Low');
    assert.equal(cases[2].type, 'Positive');
    assert.equal(cases[2].priority, 'Medium');
});

test('steps are renumbered from 1 whatever the model emitted', () => {
    const cases = assignIds(
        [{ workItemKey: 'SCRUM-5', title: 'a', steps: ['3. open the page', 'click sign in', '9) observe'] }],
        [item('SCRUM-5')]
    );
    assert.deepEqual(cases[0].steps, ['1. open the page', '2. click sign in', '3. observe']);
});

test('a criterion reference past the end of the list is dropped, not trusted', () => {
    const cases = assignIds(
        [
            { workItemKey: 'SCRUM-5', title: 'a', acceptanceCriterionRef: 'AC-2' },
            { workItemKey: 'SCRUM-5', title: 'b', acceptanceCriterionRef: 'AC-9' },
            { workItemKey: 'SCRUM-5', title: 'c', acceptanceCriterionRef: 'ac 1' },
            { workItemKey: 'SCRUM-5', title: 'd', acceptanceCriterionRef: 'none' },
        ],
        [item('SCRUM-5', ['one', 'two'])]
    );
    assert.equal(cases[0].acceptanceCriterionRef, 'AC-2');
    assert.equal(cases[1].acceptanceCriterionRef, null, 'AC-9 does not exist and must not be kept');
    assert.equal(cases[2].acceptanceCriterionRef, 'AC-1', 'loose formatting should normalise');
    assert.equal(cases[3].acceptanceCriterionRef, null);
});

test('cases with no title are dropped', () => {
    const cases = assignIds(
        [{ workItemKey: 'SCRUM-5', title: '  ' }, { workItemKey: 'SCRUM-5', title: 'real' }, null],
        [item('SCRUM-5')]
    );
    assert.equal(cases.length, 1);
    assert.equal(cases[0].title, 'real');
});

test('every case starts as Draft', () => {
    const cases = assignIds([{ workItemKey: 'SCRUM-5', title: 'a', status: 'Passed' }], [item('SCRUM-5')]);
    assert.equal(cases[0].status, 'Draft', 'the model does not get to declare a case already passed');
});

console.log('\nids.ts — coverage gaps');

test('an uncovered criterion is reported', () => {
    const work = item('SCRUM-5', ['first thing', 'second thing', 'third thing']);
    const cases = assignIds(
        [
            { workItemKey: 'SCRUM-5', title: 'a', acceptanceCriterionRef: 'AC-1' },
            { workItemKey: 'SCRUM-5', title: 'b', acceptanceCriterionRef: 'AC-3' },
        ],
        [work]
    );
    const gaps = coverageGaps([work], cases);
    assert.equal(gaps.length, 1);
    assert.ok(gaps[0].includes('AC-2'), gaps[0]);
    assert.ok(gaps[0].includes('second thing'), gaps[0]);
});

test('full coverage produces no gaps', () => {
    const work = item('SCRUM-5', ['one', 'two']);
    const cases = assignIds(
        [
            { workItemKey: 'SCRUM-5', title: 'a', acceptanceCriterionRef: 'AC-1' },
            { workItemKey: 'SCRUM-5', title: 'b', acceptanceCriterionRef: 'AC-2' },
        ],
        [work]
    );
    assert.deepEqual(coverageGaps([work], cases), []);
});

test('an item with no criteria says so rather than reporting nothing', () => {
    const work = item('SCRUM-7');
    const cases = assignIds([{ workItemKey: 'SCRUM-7', title: 'a' }], [work]);
    const gaps = coverageGaps([work], cases);
    assert.equal(gaps.length, 1);
    assert.ok(gaps[0].includes('stated no acceptance criteria'), gaps[0]);
});

console.log(`\n${passed} passed\n`);
