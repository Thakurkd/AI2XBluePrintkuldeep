/**
 * Atlassian Document Format → plain text with light markdown.
 *
 * Jira Cloud returns descriptions as a nested node tree, not a string. What must
 * survive the walk is structure a tester's meaning depends on: heading levels,
 * list nesting, table rows, and code blocks. Losing list structure is the failure
 * that matters most, because acceptance criteria are almost always a list, and a
 * flattened list becomes one run-on sentence that the criteria splitter then cuts
 * in the wrong places (architecture/02_workitem_fetch.md).
 */

interface Ctx {
    /** How many lists deep we are, for indentation. */
    depth: number;
}

/** Inline marks Jira applies to a text node. */
function applyMarks(node: any): string {
    let text: string = node.text ?? '';
    if (!text) return '';

    for (const mark of node.marks ?? []) {
        switch (mark.type) {
            case 'strong':
                text = `**${text}**`;
                break;
            case 'em':
                text = `_${text}_`;
                break;
            case 'code':
                text = `\`${text}\``;
                break;
            case 'strike':
                text = `~~${text}~~`;
                break;
            case 'link': {
                const href = mark.attrs?.href;
                // A link whose text already is the URL renders as [url](url); keep it bare.
                text = href && href !== text ? `[${text}](${href})` : (href ?? text);
                break;
            }
            default:
                break; // underline, colour, subsup - no plain-text equivalent worth inventing
        }
    }
    return text;
}

/** Render a bullet or ordered list, preserving nesting depth. */
function renderList(node: any, ctx: Ctx, ordered: boolean): string {
    const indent = '  '.repeat(ctx.depth);
    const items: string[] = [];
    let n = node.attrs?.order ?? 1;

    for (const item of node.content ?? []) {
        const marker = ordered ? `${n++}.` : '-';
        const body = walk(item.content, { depth: ctx.depth + 1 }).trim();
        if (!body) continue;

        // A nested list inside the item arrives as later lines; indent the
        // continuation so the nesting is still visible after flattening.
        const [first, ...rest] = body.split('\n');
        items.push(
            [`${indent}${marker} ${first}`, ...rest.map((l) => (l.trim() ? `${indent}${l}` : l))].join('\n')
        );
    }
    return items.length ? `${items.join('\n')}\n` : '';
}

/** Cells of one table row, as text. */
function rowCells(row: any): string[] {
    return (row.content ?? []).map((cell: any) => walk(cell.content, { depth: 0 }).replace(/\s+/g, ' ').trim());
}

function renderTable(node: any): string {
    const rows: any[] = (node.content ?? []).filter((r: any) => r.type === 'tableRow');
    if (!rows.length) return '';

    const rendered = rows.map(rowCells);
    const width = Math.max(...rendered.map((r) => r.length));
    const pad = (cells: string[]) => [...cells, ...Array(width - cells.length).fill('')];

    // The first row becomes the header whether or not Jira marked it as one:
    // markdown has no data-only table, and without a separator row the result is
    // not a table at all — a model reading it cannot tell columns from prose.
    const lines = [
        `| ${pad(rendered[0]).join(' | ')} |`,
        `| ${Array(width).fill('---').join(' | ')} |`,
        ...rendered.slice(1).map((cells) => `| ${pad(cells).join(' | ')} |`),
    ];
    return `\n${lines.join('\n')}\n`;
}

function walk(node: any, ctx: Ctx): string {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map((n) => walk(n, ctx)).join('');

    const kids = () => walk(node.content, ctx);

    switch (node.type) {
        case 'doc':
            return kids();
        case 'text':
            return applyMarks(node);
        case 'hardBreak':
            return '\n';
        case 'paragraph':
            return `${kids().replace(/[ \t]+$/, '')}\n`;
        case 'heading':
            return `\n${'#'.repeat(node.attrs?.level ?? 1)} ${kids().trim()}\n`;
        case 'bulletList':
            return renderList(node, ctx, false);
        case 'orderedList':
            return renderList(node, ctx, true);
        case 'listItem':
            // Reached only when a listItem appears outside a list; lists handle
            // their own items so the marker is not emitted twice.
            return kids();
        case 'codeBlock':
            return `\n\`\`\`${node.attrs?.language ?? ''}\n${kids().trim()}\n\`\`\`\n`;
        case 'blockquote':
            return `${kids()
                .trim()
                .split('\n')
                .map((l) => `> ${l}`)
                .join('\n')}\n`;
        case 'panel':
            return `\n${kids().trim()}\n`;
        case 'rule':
            return '\n---\n';
        case 'table':
            return renderTable(node);
        case 'tableRow':
            return `| ${rowCells(node).join(' | ')} |\n`;
        case 'tableCell':
        case 'tableHeader':
            return kids();
        case 'mention':
            return `@${node.attrs?.text?.replace(/^@/, '') ?? 'user'}`;
        case 'emoji':
            return node.attrs?.text ?? node.attrs?.shortName ?? '';
        case 'date':
            return node.attrs?.timestamp ? new Date(Number(node.attrs.timestamp)).toISOString().slice(0, 10) : '';
        case 'status':
            return `[${node.attrs?.text ?? ''}]`;
        case 'inlineCard':
        case 'blockCard':
            return node.attrs?.url ?? '';
        case 'media':
            // Attachments are not read in v1. Naming them is honest; pretending
            // the description was complete is not.
            return `[attachment${node.attrs?.alt ? `: ${node.attrs.alt}` : ''}]\n`;
        case 'mediaSingle':
        case 'mediaGroup':
            return kids();
        case 'expand':
        case 'nestedExpand':
            return `\n${node.attrs?.title ? `${node.attrs.title}\n` : ''}${kids()}`;
        default:
            return kids();
    }
}

/** Flatten an ADF document (or any node) to readable text. */
export function adfToText(node: unknown): string {
    return walk(node, { depth: 0 })
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
