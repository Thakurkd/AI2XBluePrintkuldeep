/**
 * Acceptance-criteria splitting. Run: node --import tsx tools/util/criteria.test.ts
 *
 * The first test is the one findings.md §11 called out as highest-value: SCRUM-5
 * has an "Out of Scope" section directly after its criteria, and without the
 * section-end stop, three out-of-scope items become acceptance criteria and
 * generate test cases for features that do not exist.
 */
import assert from 'node:assert/strict';
import { extractAcceptanceCriteria, labelCriteria } from './criteria.js';

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

console.log('\ncriteria.ts');

// The real SCRUM-5 description, as flattened by adf.ts.
const SCRUM_5 = `As a registered customer, I want to sign in with my email address and password so that I can view my order history and saved addresses.

### Context
The sign-in form lives at /login and has an Email field, a Password field, a "Remember me" checkbox, and a "Sign in" button.

### Acceptance Criteria
- Valid email and password redirect the customer to /account and show "Welcome back, <first name>" in the header.
- An incorrect password shows the inline error "Incorrect email or password" and keeps the customer on /login.
- An email that is not registered shows the same error, so the form does not reveal which accounts exist.
- Submitting with an empty Email or empty Password field shows "This field is required".
- An email missing an @ symbol shows "Enter a valid email address" before the form submits.
- After 5 consecutive failed attempts the account locks for 15 minutes.
- With "Remember me" ticked the session survives a browser restart.
- The Password field masks input and is never included in any network request.

### Out of Scope
- Social sign-in (Google, Apple)
- Two-factor authentication
- New account registration`;

test('stops at the Out of Scope heading — the regression that matters', () => {
    const criteria = extractAcceptanceCriteria(SCRUM_5);
    assert.equal(criteria.length, 8, `expected 8 criteria, got ${criteria.length}`);

    const joined = criteria.join(' | ').toLowerCase();
    for (const leaked of ['social sign-in', 'two-factor', 'new account registration']) {
        assert.ok(!joined.includes(leaked), `"${leaked}" leaked in from Out of Scope`);
    }
});

test('does not swallow the Context section above the heading', () => {
    const criteria = extractAcceptanceCriteria(SCRUM_5);
    assert.ok(
        !criteria.join(' ').includes('The sign-in form lives at'),
        'prose from before the heading was treated as a criterion'
    );
});

test('keeps each bullet whole', () => {
    const criteria = extractAcceptanceCriteria(SCRUM_5);
    assert.ok(criteria[0].startsWith('Valid email and password redirect'));
    assert.ok(criteria[5].includes('5 consecutive failed attempts'));
});

test('numbered lists split one per item', () => {
    const criteria = extractAcceptanceCriteria(
        ['Acceptance Criteria', '1. The user can log in.', '2. The user can log out.', '3) Sessions expire.'].join('\n')
    );
    assert.deepEqual(criteria, ['The user can log in.', 'The user can log out.', 'Sessions expire.']);
});

test('a continuation line folds into the bullet above it', () => {
    const criteria = extractAcceptanceCriteria(
        ['## AC', '- The total updates', '  when quantity changes.', '- Tax is recalculated.'].join('\n')
    );
    assert.equal(criteria.length, 2);
    assert.equal(criteria[0], 'The total updates when quantity changes.');
});

test('Gherkin groups one criterion per scenario, not per step', () => {
    const criteria = extractAcceptanceCriteria(
        [
            'Acceptance Criteria',
            'Given a registered customer',
            'When they submit valid credentials',
            'Then they land on /account',
            'Given a locked account',
            'When they submit valid credentials',
            'Then they see the lock message',
        ].join('\n')
    );
    assert.equal(criteria.length, 2, `expected 2 scenarios, got ${criteria.length}`);
    assert.ok(criteria[0].includes('registered customer'));
    assert.ok(criteria[1].includes('locked account'));
});

test('inline form keeps the text on the heading line', () => {
    const criteria = extractAcceptanceCriteria('Acceptance Criteria: the banner disappears after 5 seconds.');
    assert.deepEqual(criteria, ['the banner disappears after 5 seconds.']);
});

test('no criteria is an empty array, not a guess', () => {
    assert.deepEqual(extractAcceptanceCriteria('Just a plain description with no criteria.'), []);
    assert.deepEqual(extractAcceptanceCriteria(''), []);
});

test('a Definition of Done section also ends the scrape', () => {
    const criteria = extractAcceptanceCriteria(
        ['## Acceptance Criteria', '- It works', '## Definition of Done', '- Code reviewed', '- Deployed'].join('\n')
    );
    assert.deepEqual(criteria, ['It works']);
});

test('labelCriteria numbers from AC-1', () => {
    assert.deepEqual(labelCriteria(['a', 'b']), [
        { ref: 'AC-1', text: 'a' },
        { ref: 'AC-2', text: 'b' },
    ]);
});

console.log(`\n${passed} passed\n`);
