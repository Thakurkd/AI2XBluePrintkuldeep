/**
 * Markdown → ADF. Run: node --import tsx tools/share/markdownToAdf.test.ts
 *
 * This runs against someone else's ticket, so a bug here is visible to the whole
 * team as a comment full of literal ## and |.
 */
import assert from 'node:assert/strict';
import { markdownToAdf } from './markdownToAdf.js';

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

const flat = (node: any): string => JSON.stringify(node);

console.log('\nmarkdownToAdf.ts');

test('a document always has a valid envelope', () => {
    const doc = markdownToAdf('');
    assert.equal(doc.type, 'doc');
    assert.equal(doc.version, 1);
    assert.ok(Array.isArray(doc.content) && doc.content.length > 0, 'content must never be empty');
});

test('headings carry their level', () => {
    const doc = markdownToAdf('## Test plan generated');
    assert.equal(doc.content[0].type, 'heading');
    assert.equal(doc.content[0].attrs.level, 2);
    assert.equal(doc.content[0].content[0].text, 'Test plan generated');
});

test('no literal markdown survives into a heading', () => {
    const doc = markdownToAdf('# Plan\n\nSome text.');
    assert.ok(!flat(doc).includes('# Plan'), 'the hash marks leaked into the comment');
});

test('bullet lists become bulletList/listItem', () => {
    const doc = markdownToAdf('- first\n- second');
    assert.equal(doc.content[0].type, 'bulletList');
    assert.equal(doc.content[0].content.length, 2);
    assert.equal(doc.content[0].content[0].type, 'listItem');
    assert.equal(doc.content[0].content[0].content[0].content[0].text, 'first');
});

test('numbered lists become orderedList', () => {
    const doc = markdownToAdf('1. one\n2. two');
    assert.equal(doc.content[0].type, 'orderedList');
    assert.equal(doc.content[0].content.length, 2);
});

test('tables become a real ADF table with header cells', () => {
    const doc = markdownToAdf(
        ['| Work item | Feature |', '| --- | --- |', '| SCRUM-5 | Sign-in |'].join('\n')
    );
    const table = doc.content[0];
    assert.equal(table.type, 'table');
    // Two rows: the separator is dropped, not rendered.
    assert.equal(table.content.length, 2);
    assert.equal(table.content[0].content[0].type, 'tableHeader');
    assert.equal(table.content[1].content[0].type, 'tableCell');
    assert.ok(!flat(doc).includes('---'), 'the separator row leaked into the table');
});

test('an escaped pipe inside a cell is restored', () => {
    const doc = markdownToAdf(['| Risk |', '| --- |', '| A \\| B |'].join('\n'));
    assert.ok(flat(doc).includes('A | B'), 'the escaped pipe was not unescaped');
});

test('inline marks convert', () => {
    const doc = markdownToAdf('**bold** then `code` then [a link](https://example.com)');
    const marks = doc.content[0].content.flatMap((n: any) => (n.marks ?? []).map((m: any) => m.type));
    assert.ok(marks.includes('strong'), flat(doc));
    assert.ok(marks.includes('code'), flat(doc));
    assert.ok(marks.includes('link'), flat(doc));
    assert.ok(!flat(doc).includes('**'), 'asterisks leaked as literal text');
});

test('a horizontal rule becomes a rule node, not a list item', () => {
    const doc = markdownToAdf('text\n\n---\n\nmore');
    assert.ok(
        doc.content.some((n: any) => n.type === 'rule'),
        flat(doc)
    );
    assert.ok(
        !doc.content.some((n: any) => n.type === 'bulletList'),
        'the rule was mistaken for a bullet'
    );
});

test('code fences become a codeBlock', () => {
    const doc = markdownToAdf('```json\n{"a":1}\n```');
    assert.equal(doc.content[0].type, 'codeBlock');
    assert.equal(doc.content[0].content[0].text, '{"a":1}');
});

test('consecutive plain lines join into one paragraph', () => {
    const doc = markdownToAdf('one line\nsecond line\n\nnew paragraph');
    const paragraphs = doc.content.filter((n: any) => n.type === 'paragraph');
    assert.equal(paragraphs.length, 2);
    assert.equal(paragraphs[0].content[0].text, 'one line second line');
});

test('a paragraph never has empty content, which ADF rejects', () => {
    const doc = markdownToAdf('   \n\n   ');
    for (const node of doc.content) {
        if (node.type === 'paragraph') {
            assert.ok(node.content.length > 0, 'empty paragraph content would be a 400 from Jira');
        }
    }
});

console.log(`\n${passed} passed\n`);
