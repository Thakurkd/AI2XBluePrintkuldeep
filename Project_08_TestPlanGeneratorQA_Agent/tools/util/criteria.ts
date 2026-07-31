/**
 * Acceptance criteria extraction: flattened description text → string[].
 *
 * Operates on text, not on ADF or HTML, so Jira and (later) ADO share it.
 *
 * Why an array and not a blob: P2's coverage rule is "at least one test case per
 * acceptance criterion", and the renderer's coverage matrix has one row per
 * criterion. Both are only as good as this split, which is why it has its own file
 * and its own tests rather than living inside the connector.
 *
 * Priority order (architecture/02_workitem_fetch.md):
 *   1. a dedicated custom field  — handled by the caller, never reaches here
 *   2. an "Acceptance Criteria" heading in the description
 *   3. Gherkin scenarios anywhere in the description
 */

/** Headings that start the acceptance-criteria section. */
const AC_HEADING = /^\s*(?:#{1,6}\s*)?[*_\s]*(acceptance\s*criteria|acceptance|\bac\b|criteria)\s*[:*_#]*\s*$/i;

/** Inline form: "Acceptance Criteria: the user can log in". */
const AC_INLINE = /^\s*(?:#{1,6}\s*)?[*_\s]*(?:acceptance\s*criteria|\bac\b)\s*[*_]*\s*:\s*(.+)$/i;

/** Headings that end it. Anything else is treated as part of the section. */
const SECTION_END =
    /^\s*(?:#{1,6}\s*)?[*_\s]*(definition\s*of\s*done|dod|notes?|out\s*of\s*scope|non[- ]goals?|dependencies|design|technical\s*notes?|implementation|tasks?|sub-?tasks?|test(ing)?\s*notes?|attachments?|references?|links?|questions?)\b/i;

const BULLET = /^\s*(?:[-*•·–—]|\d+[.)]|\(\d+\)|[a-z][.)])\s+/i;
const GHERKIN_START = /^\s*(?:\*\*|_)?\s*(given|scenario|scenario\s*outline|feature)\b/i;
const GHERKIN_STEP = /^\s*(?:\*\*|_)?\s*(given|when|then|and|but)\b/i;

const clean = (s: string) =>
    s
        .replace(BULLET, '')
        .replace(/^\s*(?:#{1,6})\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Gherkin scenarios group into one criterion per scenario — a Given/When/Then
 * triplet is one behaviour, and splitting it into three criteria would demand
 * three test cases for one requirement.
 */
function gherkinScenarios(lines: string[]): string[] {
    const scenarios: string[] = [];
    let current: string[] = [];

    const flush = () => {
        if (current.length) scenarios.push(current.join(' ').replace(/\s+/g, ' ').trim());
        current = [];
    };

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        const isStart = GHERKIN_START.test(line);
        const isStep = GHERKIN_STEP.test(line);

        if (isStart && current.length) flush();
        if (isStart || isStep) {
            current.push(clean(line));
        } else if (current.length) {
            // Prose after a scenario ends it.
            flush();
        }
    }
    flush();
    return scenarios.filter(Boolean);
}

/** Split the body of an AC section into one entry per criterion. */
function splitCriteria(body: string[]): string[] {
    const nonEmpty = body.filter((l) => l.trim());
    if (!nonEmpty.length) return [];

    // Gherkin wins when it is clearly the format in use.
    const gherkinLines = nonEmpty.filter((l) => GHERKIN_STEP.test(l)).length;
    if (gherkinLines >= 2 && gherkinLines / nonEmpty.length > 0.5) {
        const scenarios = gherkinScenarios(nonEmpty);
        if (scenarios.length) return scenarios;
    }

    // Bulleted or numbered: one criterion per bullet, with unbulleted
    // continuation lines folded into the bullet above them.
    if (nonEmpty.some((l) => BULLET.test(l))) {
        const items: string[] = [];
        for (const line of nonEmpty) {
            if (BULLET.test(line)) {
                items.push(clean(line));
            } else if (items.length) {
                items[items.length - 1] = `${items[items.length - 1]} ${clean(line)}`.trim();
            } else {
                items.push(clean(line));
            }
        }
        return items.filter(Boolean);
    }

    // Prose: blank lines separate criteria; a single paragraph is one criterion.
    const paragraphs: string[] = [];
    let buffer: string[] = [];
    for (const line of body) {
        if (line.trim()) {
            buffer.push(clean(line));
        } else if (buffer.length) {
            paragraphs.push(buffer.join(' '));
            buffer = [];
        }
    }
    if (buffer.length) paragraphs.push(buffer.join(' '));
    return paragraphs.filter(Boolean);
}

/**
 * Pull acceptance criteria out of a flattened description.
 * Returns `[]` when the description has none — a legitimate answer that the UI
 * surfaces before generation rather than papering over.
 */
export function extractAcceptanceCriteria(description: string): string[] {
    if (!description?.trim()) return [];
    const lines = description.split('\n');

    // Find the section heading, if there is one.
    let start = -1;
    let inlineFirst = '';
    for (let i = 0; i < lines.length; i++) {
        const inline = lines[i].match(AC_INLINE);
        if (inline) {
            start = i;
            inlineFirst = inline[1].trim();
            break;
        }
        if (AC_HEADING.test(lines[i])) {
            start = i;
            break;
        }
    }

    if (start === -1) {
        // No heading. Gherkin scattered through the description still counts.
        const scenarios = gherkinScenarios(lines);
        return scenarios.length > 1 ? scenarios : [];
    }

    const body: string[] = [];
    for (let i = start + 1; i < lines.length; i++) {
        if (SECTION_END.test(lines[i])) break;
        body.push(lines[i]);
    }

    const criteria = splitCriteria(body);
    // An inline criterion on the heading line is the first entry, not a lost one.
    return inlineFirst ? [clean(inlineFirst), ...criteria] : criteria;
}

/** Label criteria for prompts and the coverage matrix: AC-1, AC-2, … */
export function labelCriteria(criteria: string[]): { ref: string; text: string }[] {
    return criteria.map((text, i) => ({ ref: `AC-${i + 1}`, text }));
}
