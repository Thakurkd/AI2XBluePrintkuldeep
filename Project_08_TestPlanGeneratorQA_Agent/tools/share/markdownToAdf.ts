/**
 * Markdown → Atlassian Document Format.
 *
 * Required, not polish. Jira's comment API takes ADF, and posting raw markdown
 * produces a comment full of literal `##` and `|` that looks broken to everyone
 * on the ticket (architecture/04_share_export.md).
 *
 * Scope: headings, paragraphs, bullet and ordered lists, tables, rules, code
 * blocks, and the inline marks that carry meaning — bold, italic, code, links.
 */

type Node = Record<string, any>;

const INLINE = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/;

/** Split a line into text nodes with marks. */
function inlineNodes(text: string): Node[] {
    if (!text) return [];

    const nodes: Node[] = [];
    for (const part of text.split(INLINE).filter((p) => p !== '' && p !== undefined)) {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
            nodes.push({
                type: 'text',
                text: link[1],
                marks: [{ type: 'link', attrs: { href: link[2] } }],
            });
            continue;
        }
        const bold = part.match(/^(?:\*\*|__)(.+)(?:\*\*|__)$/);
        if (bold) {
            nodes.push({ type: 'text', text: bold[1], marks: [{ type: 'strong' }] });
            continue;
        }
        const italic = part.match(/^(?:\*|_)(.+)(?:\*|_)$/);
        if (italic) {
            nodes.push({ type: 'text', text: italic[1], marks: [{ type: 'em' }] });
            continue;
        }
        const code = part.match(/^`(.+)`$/);
        if (code) {
            nodes.push({ type: 'text', text: code[1], marks: [{ type: 'code' }] });
            continue;
        }
        nodes.push({ type: 'text', text: part });
    }
    // ADF rejects an empty text node, and a paragraph must have content.
    return nodes.filter((n) => n.text !== '');
}

const paragraph = (text: string): Node => {
    const content = inlineNodes(text);
    return { type: 'paragraph', content: content.length ? content : [{ type: 'text', text: ' ' }] };
};

const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_SEPARATOR = /^\s*\|[\s:|-]+\|\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```(\w*)\s*$/;

function cellsOf(line: string): string[] {
    const inner = line.match(TABLE_ROW)?.[1] ?? '';
    // Split on unescaped pipes only. Splitting on every pipe would cut a cell
    // containing an escaped one ("A \| B") into two, which is how the renderer
    // writes any value that legitimately contains a pipe.
    return inner.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

export function markdownToAdf(markdown: string): Node {
    const lines = markdown.replace(/\r/g, '').split('\n');
    const content: Node[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) {
            i++;
            continue;
        }

        // Code block
        const fence = line.match(FENCE);
        if (fence) {
            const body: string[] = [];
            i++;
            while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
            i++; // closing fence
            content.push({
                type: 'codeBlock',
                ...(fence[1] ? { attrs: { language: fence[1] } } : {}),
                content: body.length ? [{ type: 'text', text: body.join('\n') }] : [],
            });
            continue;
        }

        if (RULE.test(line)) {
            content.push({ type: 'rule' });
            i++;
            continue;
        }

        const heading = line.match(HEADING);
        if (heading) {
            content.push({
                type: 'heading',
                attrs: { level: Math.min(heading[1].length, 6) },
                content: inlineNodes(heading[2]),
            });
            i++;
            continue;
        }

        // Table: a run of | rows, with the separator row dropped.
        if (TABLE_ROW.test(line)) {
            const rows: string[][] = [];
            while (i < lines.length && TABLE_ROW.test(lines[i])) {
                if (!TABLE_SEPARATOR.test(lines[i])) rows.push(cellsOf(lines[i]));
                i++;
            }
            if (rows.length) {
                content.push({
                    type: 'table',
                    attrs: { isNumberColumnEnabled: false, layout: 'default' },
                    content: rows.map((cells, rowIndex) => ({
                        type: 'tableRow',
                        content: cells.map((cell) => ({
                            type: rowIndex === 0 ? 'tableHeader' : 'tableCell',
                            attrs: {},
                            content: [paragraph(cell)],
                        })),
                    })),
                });
            }
            continue;
        }

        // Lists: a run of same-kind items.
        const isBullet = BULLET.test(line) && !RULE.test(line);
        const isOrdered = ORDERED.test(line);
        if (isBullet || isOrdered) {
            const pattern = isBullet ? BULLET : ORDERED;
            const items: Node[] = [];
            while (i < lines.length && pattern.test(lines[i]) && !RULE.test(lines[i])) {
                const text = lines[i].match(pattern)![1];
                items.push({ type: 'listItem', content: [paragraph(text)] });
                i++;
            }
            content.push({ type: isBullet ? 'bulletList' : 'orderedList', content: items });
            continue;
        }

        // Paragraph: consecutive plain lines join, as markdown does.
        const buffer: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() &&
            !HEADING.test(lines[i]) &&
            !TABLE_ROW.test(lines[i]) &&
            !BULLET.test(lines[i]) &&
            !ORDERED.test(lines[i]) &&
            !RULE.test(lines[i]) &&
            !FENCE.test(lines[i])
        ) {
            buffer.push(lines[i].trim());
            i++;
        }
        if (buffer.length) content.push(paragraph(buffer.join(' ')));
    }

    return {
        type: 'doc',
        version: 1,
        content: content.length ? content : [paragraph(' ')],
    };
}
