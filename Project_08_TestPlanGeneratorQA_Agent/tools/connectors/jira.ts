/**
 * Jira Cloud connector — SOP architecture/01_connections.md and 02_workitem_fetch.md.
 *
 * The only connector implemented in v1 (gemini.md §0 Q2). ADO and X-Ray have
 * written SOPs and no code.
 */
import axios, { AxiosInstance } from 'axios';
import { JiraConfig, WorkItem, WorkItemLink } from '../../server/types.js';
import { adfToText } from '../util/adf.js';
import { extractAcceptanceCriteria } from '../util/criteria.js';

const BASE_FIELDS = [
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
];

function fields(config: JiraConfig): string[] {
    return config.acField ? [...BASE_FIELDS, config.acField] : BASE_FIELDS;
}

function client(config: JiraConfig): AxiosInstance {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    return axios.create({
        baseURL: config.baseUrl,
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        timeout: 30_000,
    });
}

/** Translate, never forward raw. Each message names the thing to fix. */
function describeError(error: any, context: string): Error {
    const status = error.response?.status;
    const messages = error.response?.data?.errorMessages;
    const detail = Array.isArray(messages) && messages.length ? messages.join('; ') : error.message;

    if (status === 401) {
        return Object.assign(
            new Error('Jira rejected the credentials (401). Check the email and API token.'),
            { status: 401 }
        );
    }
    if (status === 403) {
        return Object.assign(
            new Error('Jira accepted the credentials but denied access (403). The account lacks permission for this project.'),
            { status: 403 }
        );
    }
    if (status === 404) {
        return Object.assign(
            new Error(`Jira returned 404 for ${context}. Check the site URL points at your site root and the key exists.`),
            { status: 404 }
        );
    }
    if (error.code === 'ENOTFOUND') {
        return Object.assign(new Error(`Cannot reach ${error.hostname ?? 'the Jira site'}. Check the URL.`), { status: 502 });
    }
    return Object.assign(new Error(`Jira error during ${context}: ${detail}`), { status: status ?? 502 });
}

export interface JiraIdentity {
    ok: true;
    displayName: string;
    email: string;
    accountId: string;
    baseUrl: string;
    projects: { key: string; name: string }[];
}

/**
 * Test Connection. Returns who the credential belongs to and what it can see —
 * "ok" is not proof (gemini.md invariant 4). A token can be valid and still point
 * at the wrong site, which otherwise shows up as a confusing empty result later.
 */
export async function verifyConnection(config: JiraConfig): Promise<JiraIdentity> {
    const http = client(config);

    let me: any;
    try {
        ({ data: me } = await http.get('/rest/api/3/myself'));
    } catch (error) {
        throw describeError(error, 'connection check');
    }

    let projects: { key: string; name: string }[] = [];
    try {
        const { data } = await http.get('/rest/api/3/project/search', {
            params: { maxResults: 50, orderBy: 'lastIssueUpdatedTime' },
        });
        projects = (data.values ?? []).map((p: any) => ({ key: p.key, name: p.name }));
    } catch {
        // Reading projects needs broader permission than reading yourself. The
        // connection is still valid, so this is a warning, not a failure.
    }

    return {
        ok: true,
        displayName: me.displayName,
        email: me.emailAddress ?? config.email,
        accountId: me.accountId,
        baseUrl: config.baseUrl,
        projects,
    };
}

/**
 * Jira Cloud replaced POST /rest/api/3/search with /rest/api/3/search/jql, and
 * sites sit on different sides of that migration (findings.md §5).
 */
async function search(config: JiraConfig, jql: string, maxResults: number) {
    const http = client(config);
    try {
        const { data } = await http.post('/rest/api/3/search/jql', {
            jql,
            maxResults,
            fields: fields(config),
        });
        return data.issues ?? [];
    } catch (error: any) {
        if (![404, 410].includes(error.response?.status)) throw error;
        const { data } = await http.post('/rest/api/3/search', {
            jql,
            maxResults,
            startAt: 0,
            fields: fields(config),
        });
        return data.issues ?? [];
    }
}

const ISSUE_KEY = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;
const PROJECT_KEY = /^[A-Za-z][A-Za-z0-9_]*$/;

export function looksLikeIssueKey(value: string): boolean {
    return ISSUE_KEY.test(value.trim());
}

/**
 * People paste what they have to hand — a key, a browse URL, or a list. Turn all
 * of it into keys rather than forwarding Jira's parser error (Project_07 finding).
 */
export function parseIds(input: string): { keys: string[]; projectKey?: string } {
    const trimmed = input.trim();
    if (!trimmed) return { keys: [] };

    const tokens = trimmed
        .split(/[\s,]+/)
        .filter(Boolean)
        // https://site.atlassian.net/browse/SCRUM-5?filter=1  ->  SCRUM-5
        .map((token) => {
            const fromUrl = token.match(/\/browse\/([A-Za-z][A-Za-z0-9_]*-\d+)/);
            return fromUrl ? fromUrl[1] : token;
        })
        .map((token) => token.replace(/[?#].*$/, ''));

    const keys = tokens.filter((t) => ISSUE_KEY.test(t)).map((t) => t.toUpperCase());
    if (keys.length) return { keys };

    if (tokens.length === 1 && PROJECT_KEY.test(tokens[0])) {
        return { keys: [], projectKey: tokens[0].toUpperCase() };
    }
    return { keys: [] };
}

function linksOf(f: any): WorkItemLink[] {
    const links: WorkItemLink[] = [];

    if (f.parent) {
        links.push({
            type: f.parent.fields?.issuetype?.name?.toLowerCase() === 'epic' ? 'epic' : 'parent',
            key: f.parent.key,
            title: f.parent.fields?.summary ?? '',
        });
    }
    for (const s of f.subtasks ?? []) {
        links.push({ type: 'subtask', key: s.key, title: s.fields?.summary ?? '' });
    }
    for (const l of f.issuelinks ?? []) {
        const other = l.outwardIssue ?? l.inwardIssue;
        if (!other) continue;
        const relation = String((l.outwardIssue ? l.type?.outward : l.type?.inward) ?? '').toLowerCase();
        const type: WorkItemLink['type'] = relation.includes('block')
            ? l.outwardIssue
                ? 'blocks'
                : 'blocked-by'
            : 'relates';
        links.push({ type, key: other.key, title: other.fields?.summary ?? '' });
    }
    return links;
}

function toWorkItem(issue: any, config: JiraConfig): WorkItem {
    const f = issue.fields ?? {};
    const description = adfToText(f.description);

    // A structured custom field always beats scraping a heading out of prose
    // (architecture/02_workitem_fetch.md §Acceptance criteria).
    let acceptanceCriteria: string[] = [];
    let criteriaSource: WorkItem['criteriaSource'] = 'none';

    if (config.acField && f[config.acField]) {
        const raw = f[config.acField];
        const text = typeof raw === 'string' ? raw : adfToText(raw);
        acceptanceCriteria = extractAcceptanceCriteria(text);
        if (!acceptanceCriteria.length && text.trim()) acceptanceCriteria = [text.trim()];
        if (acceptanceCriteria.length) criteriaSource = 'field';
    }
    if (!acceptanceCriteria.length) {
        acceptanceCriteria = extractAcceptanceCriteria(description);
        if (acceptanceCriteria.length) criteriaSource = 'description';
    }

    return {
        id: String(issue.id ?? issue.key),
        key: issue.key,
        source: 'jira',
        title: f.summary ?? '',
        type: f.issuetype?.name ?? 'Unknown',
        status: f.status?.name ?? 'Unknown',
        priority: f.priority?.name ?? 'None',
        assignee: f.assignee?.displayName ?? null,
        reporter: f.reporter?.displayName ?? null,
        labels: f.labels ?? [],
        components: (f.components ?? []).map((c: any) => c.name),
        description,
        acceptanceCriteria,
        criteriaSource,
        links: linksOf(f),
        url: `${config.baseUrl}/browse/${issue.key}`,
        fetchedAt: new Date().toISOString(),
    };
}

export async function fetchByKey(config: JiraConfig, key: string): Promise<WorkItem> {
    try {
        const { data } = await client(config).get(`/rest/api/3/issue/${encodeURIComponent(key)}`, {
            params: { fields: fields(config).join(',') },
        });
        return toWorkItem(data, config);
    } catch (error) {
        throw describeError(error, `fetching ${key}`);
    }
}

export interface FetchResult {
    items: WorkItem[];
    /** Linked keys we did not fetch, so the UI can offer them without pretending they are included. */
    available: WorkItemLink[];
}

/** Depth-1 expansion, capped. An unbounded epic walk produces a plan about nothing. */
const MAX_LINKED = 10;

/**
 * Resolve whatever the user typed into work items.
 * `include` names linked keys the user ticked; linked items are never pulled in
 * silently (architecture/02_workitem_fetch.md).
 */
export async function fetchWorkItems(
    config: JiraConfig,
    input: string,
    include: string[] = []
): Promise<FetchResult> {
    const { keys, projectKey } = parseIds(input);

    let primary: WorkItem[];
    if (keys.length) {
        primary = await Promise.all(keys.map((key) => fetchByKey(config, key)));
    } else if (projectKey) {
        try {
            const issues = await search(config, `project = "${projectKey}" ORDER BY updated DESC`, 1);
            if (!issues.length) {
                throw Object.assign(
                    new Error(`Project ${projectKey} has no issues this account can read.`),
                    { status: 404 }
                );
            }
            primary = [toWorkItem(issues[0], config)];
        } catch (error: any) {
            if (error.status) throw error;
            throw describeError(error, `searching project ${projectKey}`);
        }
    } else {
        throw Object.assign(
            new Error(
                `"${input}" is not a Jira issue key. Enter a key like SCRUM-5, a browse URL, or a project key.`
            ),
            { status: 400 }
        );
    }

    const primaryKeys = new Set(primary.map((i) => i.key));
    const available = primary
        .flatMap((i) => i.links)
        .filter((l) => !primaryKeys.has(l.key))
        .slice(0, MAX_LINKED);

    const wanted = available.filter((l) => include.includes(l.key));
    const linked = await Promise.all(wanted.map((l) => fetchByKey(config, l.key)));

    return { items: [...primary, ...linked], available };
}
