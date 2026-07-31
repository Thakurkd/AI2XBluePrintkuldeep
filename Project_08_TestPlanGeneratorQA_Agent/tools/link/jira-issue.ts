/**
 * Link handshake 2.2 — one real issue, end to end.
 *
 * Proves the part the whole plan depends on: that a work item arrives, that ADF
 * flattens to something a model can reason over, and that acceptance criteria
 * split into one entry per criterion. If this handshake looks wrong, every plan
 * built on it will be wrong in the same way.
 *
 *   npm run link:issue                 -> newest issue in JIRA_PROJECT_KEY
 *   npm run link:issue -- --key SCRUM-5
 */
import axios from 'axios';
import { env, required, args, heading, line, pass, fail, explain } from './_env.js';
import { adfToText } from '../util/adf.js';
import { extractAcceptanceCriteria, labelCriteria } from '../util/criteria.js';

const baseUrl = required('JIRA_BASE_URL').replace(/\/+$/, '');
const email = required('JIRA_EMAIL');
const apiToken = required('JIRA_API_TOKEN');
const projectKey = env('JIRA_PROJECT_KEY');
const acField = env('JIRA_AC_FIELD');
const { key: requestedKey } = args();

const FIELDS = [
    'summary',
    'description',
    'status',
    'issuetype',
    'priority',
    'assignee',
    'reporter',
    'labels',
    'components',
    'subtasks',
    'issuelinks',
    'parent',
    ...(acField ? [acField] : []),
];

const http = axios.create({
    baseURL: baseUrl,
    headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 30_000,
});

/**
 * Jira Cloud replaced POST /rest/api/3/search with /rest/api/3/search/jql, and
 * sites are on different sides of that migration (findings.md §5).
 */
async function search(jql: string, maxResults: number) {
    try {
        const { data } = await http.post('/rest/api/3/search/jql', { jql, maxResults, fields: FIELDS });
        return data.issues ?? [];
    } catch (error: any) {
        if (![404, 410].includes(error.response?.status)) throw error;
        line('note', 'this site uses the legacy /rest/api/3/search endpoint');
        const { data } = await http.post('/rest/api/3/search', { jql, maxResults, startAt: 0, fields: FIELDS });
        return data.issues ?? [];
    }
}

heading(`Jira issue handshake — ${baseUrl}`);

let issue: any;
try {
    if (requestedKey) {
        const { data } = await http.get(`/rest/api/3/issue/${encodeURIComponent(requestedKey)}`, {
            params: { fields: FIELDS.join(',') },
        });
        issue = data;
    } else {
        if (!projectKey) fail('No --key given and JIRA_PROJECT_KEY is not set.');
        const issues = await search(`project = "${projectKey}" ORDER BY updated DESC`, 1);
        if (!issues.length) fail(`Project ${projectKey} has no issues this account can read.`);
        issue = issues[0];
    }
} catch (error) {
    fail(explain(error, `fetching ${requestedKey || `newest issue in ${projectKey}`}`));
}

const f = issue.fields ?? {};

line('key', issue.key);
line('summary', f.summary ?? '(none)');
line('type', f.issuetype?.name ?? '—');
line('status', f.status?.name ?? '—');
line('priority', f.priority?.name ?? '—');
line('assignee', f.assignee?.displayName ?? 'unassigned');
line('labels', (f.labels ?? []).join(', ') || '—');
line('components', (f.components ?? []).map((c: any) => c.name).join(', ') || '—');
line('url', `${baseUrl}/browse/${issue.key}`);

// --- The bit that matters: does ADF survive flattening? ---
heading('Description after ADF flattening');
const description = adfToText(f.description);
if (!description) {
    line('result', '(empty description)');
    line('impact', 'a plan can still be generated, but §14 Open Questions will carry it');
} else {
    console.log(
        description
            .split('\n')
            .map((l) => `  │ ${l}`)
            .join('\n')
    );
    line('', '');
    line('chars', description.length);
    line('lines', description.split('\n').length);
}

// --- And does the criteria splitter get one entry per criterion? ---
heading('Acceptance criteria');
let criteria: string[] = [];
let source = '';

if (acField && f[acField]) {
    const raw = f[acField];
    const text = typeof raw === 'string' ? raw : adfToText(raw);
    criteria = extractAcceptanceCriteria(text);
    if (!criteria.length && text.trim()) criteria = [text.trim()];
    source = `custom field ${acField}`;
} else {
    criteria = extractAcceptanceCriteria(description);
    source = 'scraped from the description';
}

if (!criteria.length) {
    line('found', `none (${source})`);
    line('impact', 'coverage will be derived from the description alone — the UI must say so');
} else {
    line('found', `${criteria.length} (${source})`);
    for (const { ref, text } of labelCriteria(criteria)) {
        line(ref, text.length > 96 ? `${text.slice(0, 93)}…` : text);
    }
}

// --- Linked items, capped at depth 1 (architecture/02_workitem_fetch.md) ---
heading('Linked items (depth 1)');
const subtasks = (f.subtasks ?? []).map((s: any) => `subtask   ${s.key}  ${s.fields?.summary ?? ''}`);
const links = (f.issuelinks ?? []).map((l: any) => {
    const other = l.outwardIssue ?? l.inwardIssue;
    const relation = (l.outwardIssue ? l.type?.outward : l.type?.inward) ?? 'relates to';
    return `${String(relation).padEnd(9)} ${other?.key ?? '?'}  ${other?.fields?.summary ?? ''}`;
});
const parent = f.parent ? [`parent    ${f.parent.key}  ${f.parent.fields?.summary ?? ''}`] : [];
const related = [...parent, ...subtasks, ...links];

if (!related.length) {
    line('found', 'none');
} else {
    for (const r of related.slice(0, 12)) line('', r);
    if (related.length > 12) line('', `… and ${related.length - 12} more`);
}

pass(
    `${issue.key} fetched — ${description.length} chars of description, ` +
    `${criteria.length} acceptance criterion/criteria, ${related.length} linked item(s).`
);
