/** ADF flattening. Run: node --import tsx tools/util/adf.test.ts */
import assert from 'node:assert/strict';
import { adfToText } from './adf.js';

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

const text = (value: string) => ({ type: 'text', text: value });
const paragraph = (value: string) => ({ type: 'paragraph', content: [text(value)] });

console.log('\nadf.ts');

test('empty and missing nodes are empty strings, not crashes', () => {
    assert.equal(adfToText(null), '');
    assert.equal(adfToText(undefined), '');
    assert.equal(adfToText({ type: 'doc', content: [] }), '');
});

test('headings keep their level', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            { type: 'heading', attrs: { level: 3 }, content: [text('Acceptance Criteria')] },
            paragraph('body'),
        ],
    });
    assert.ok(out.includes('### Acceptance Criteria'), out);
});

test('bullet lists survive, one item per line', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            {
                type: 'bulletList',
                content: [
                    { type: 'listItem', content: [paragraph('first')] },
                    { type: 'listItem', content: [paragraph('second')] },
                ],
            },
        ],
    });
    assert.equal(out, '- first\n- second');
});

test('nested lists keep their depth', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            {
                type: 'bulletList',
                content: [
                    {
                        type: 'listItem',
                        content: [
                            paragraph('outer'),
                            {
                                type: 'bulletList',
                                content: [{ type: 'listItem', content: [paragraph('inner')] }],
                            },
                        ],
                    },
                ],
            },
        ],
    });
    assert.ok(out.includes('- outer'), out);
    assert.ok(/\n\s+- inner/.test(out), `inner item lost its indentation:\n${out}`);
});

test('ordered lists are numbered', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            {
                type: 'orderedList',
                content: [
                    { type: 'listItem', content: [paragraph('one')] },
                    { type: 'listItem', content: [paragraph('two')] },
                ],
            },
        ],
    });
    assert.equal(out, '1. one\n2. two');
});

test('tables get a separator row, so a model can tell header from data', () => {
    const cell = (value: string, type = 'tableCell') => ({ type, content: [paragraph(value)] });
    const out = adfToText({
        type: 'doc',
        content: [
            {
                type: 'table',
                content: [
                    { type: 'tableRow', content: [cell('Field', 'tableHeader'), cell('Value', 'tableHeader')] },
                    { type: 'tableRow', content: [cell('Browser'), cell('Chrome')] },
                ],
            },
        ],
    });
    const lines = out.split('\n').filter(Boolean);
    assert.equal(lines[0], '| Field | Value |');
    assert.equal(lines[1], '| --- | --- |');
    assert.equal(lines[2], '| Browser | Chrome |');
});

test('inline marks become markdown', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: [
                    { type: 'text', text: 'bold', marks: [{ type: 'strong' }] },
                    text(' and '),
                    { type: 'text', text: 'code', marks: [{ type: 'code' }] },
                    text(' and '),
                    {
                        type: 'text',
                        text: 'a link',
                        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
                    },
                ],
            },
        ],
    });
    assert.equal(out, '**bold** and `code` and [a link](https://example.com)');
});

test('code blocks are fenced', () => {
    const out = adfToText({
        type: 'doc',
        content: [{ type: 'codeBlock', attrs: { language: 'sql' }, content: [text('select 1')] }],
    });
    assert.ok(out.includes('```sql'), out);
    assert.ok(out.includes('select 1'), out);
});

test('attachments are named rather than dropped silently', () => {
    const out = adfToText({
        type: 'doc',
        content: [
            { type: 'mediaSingle', content: [{ type: 'media', attrs: { alt: 'wireframe.png' } }] },
        ],
    });
    assert.ok(out.includes('[attachment: wireframe.png]'), out);
});

test('unknown node types keep their children instead of losing them', () => {
    const out = adfToText({
        type: 'doc',
        content: [{ type: 'someFutureNode', content: [paragraph('still here')] }],
    });
    assert.equal(out, 'still here');
});

test('runs of blank lines collapse', () => {
    const out = adfToText({
        type: 'doc',
        content: [paragraph('a'), paragraph(''), paragraph(''), paragraph('b')],
    });
    assert.ok(!out.includes('\n\n\n'), JSON.stringify(out));
});

console.log(`\n${passed} passed\n`);
