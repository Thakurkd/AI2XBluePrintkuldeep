import axios, { AxiosInstance } from 'axios';
import { JiraConfig } from '../config';
import { UserStory } from '../types';

const FIELDS = [
    'summary',
    'description',
    'status',
    'issuetype',
    'priority',
    'assignee',
    'labels',
];

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

/**
 * Jira descriptions come back as Atlassian Document Format - a nested node tree,
 * not a string. Walk it and keep only what an LLM needs: the text, plus enough
 * newlines and bullets that list structure survives.
 */
function adfToText(node: any, depth = 0): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map((n) => adfToText(n, depth)).join('');

    const children = () => adfToText(node.content, depth + 1);

    switch (node.type) {
        case 'text':
            return node.text ?? '';
        case 'hardBreak':
            return '\n';
        case 'paragraph':
        case 'heading':
            return `${children()}\n`;
        case 'listItem':
            return `${'  '.repeat(Math.max(0, depth - 2))}- ${children().trim()}\n`;
        case 'bulletList':
        case 'orderedList':
            return `${children()}\n`;
        case 'codeBlock':
            return `\n\`\`\`\n${children()}\n\`\`\`\n`;
        case 'tableRow':
            return `${children()}\n`;
        case 'tableCell':
        case 'tableHeader':
            return `${children().trim()} | `;
        default:
            return children();
    }
}

const AC_HEADING = /^\s*[#*_\s]*(acceptance\s+criteria|ac)\s*[:*_#]*\s*$/i;

/** Pull an "Acceptance Criteria" section out of the description, if the story has one. */
function extractAcceptanceCriteria(description: string): string {
    const lines = description.split('\n');
    const start = lines.findIndex((l) => AC_HEADING.test(l) || /acceptance criteria\s*:/i.test(l));
    if (start === -1) return '';

    const body: string[] = [];
    const inline = lines[start].split(/acceptance criteria\s*:/i)[1];
    if (inline?.trim()) body.push(inline.trim());

    for (let i = start + 1; i < lines.length; i++) {
        // Stop at the next section heading, but let blank lines and bullets through.
        if (/^\s*[#*_\s]*(definition of done|notes?|out of scope|dependencies)\b/i.test(lines[i])) break;
        body.push(lines[i]);
    }
    return body.join('\n').trim();
}

function toUserStory(issue: any, baseUrl: string): UserStory {
    const description = adfToText(issue.fields?.description).replace(/\n{3,}/g, '\n\n').trim();
    return {
        key: issue.key,
        summary: issue.fields?.summary ?? '',
        description,
        status: issue.fields?.status?.name ?? 'Unknown',
        issueType: issue.fields?.issuetype?.name ?? 'Unknown',
        priority: issue.fields?.priority?.name ?? 'None',
        assignee: issue.fields?.assignee?.displayName ?? null,
        labels: issue.fields?.labels ?? [],
        acceptanceCriteria: extractAcceptanceCriteria(description),
        url: `${baseUrl}/browse/${issue.key}`,
    };
}

function describeError(error: any, context: string): Error {
    const status = error.response?.status;
    const messages = error.response?.data?.errorMessages;
    const detail = Array.isArray(messages) && messages.length ? messages.join('; ') : error.message;

    if (status === 401) {
        return new Error(`Jira rejected the credentials (401). Check JIRA_EMAIL and JIRA_API_TOKEN.`);
    }
    if (status === 403) {
        return new Error(`Jira denied access (403). The account lacks permission for this project.`);
    }
    if (status === 404) {
        return new Error(`Jira returned 404 for ${context}. Check JIRA_BASE_URL points at your site root.`);
    }
    return new Error(`Jira error during ${context}: ${detail}`);
}

/** Confirms the credentials work and returns who they belong to. */
export async function verifyConnection(config: JiraConfig) {
    try {
        const { data } = await client(config).get('/rest/api/3/myself');
        return {
            ok: true as const,
            accountId: data.accountId,
            displayName: data.displayName,
            email: data.emailAddress ?? config.email,
            baseUrl: config.baseUrl,
        };
    } catch (error: any) {
        throw describeError(error, 'connection check');
    }
}

export async function listProjects(config: JiraConfig) {
    try {
        const { data } = await client(config).get('/rest/api/3/project/search', {
            params: { maxResults: 100, orderBy: 'lastIssueUpdatedTime' },
        });
        return (data.values ?? []).map((p: any) => ({ key: p.key, name: p.name, id: p.id }));
    } catch (error: any) {
        throw describeError(error, 'project lookup');
    }
}

/**
 * Jira Cloud replaced POST /rest/api/3/search with /rest/api/3/search/jql. Sites
 * are on different sides of that migration, so try the current endpoint and fall
 * back to the legacy one when it isn't there.
 */
async function search(config: JiraConfig, jql: string, maxResults: number) {
    const http = client(config);
    try {
        const { data } = await http.post('/rest/api/3/search/jql', {
            jql,
            maxResults,
            fields: FIELDS,
        });
        return data.issues ?? [];
    } catch (error: any) {
        if (![404, 410].includes(error.response?.status)) throw error;
        const { data } = await http.post('/rest/api/3/search', {
            jql,
            maxResults,
            startAt: 0,
            fields: FIELDS,
        });
        return data.issues ?? [];
    }
}

export interface FetchStoriesOptions {
    projectKey?: string;
    jql?: string;
    maxResults?: number;
}

const ISSUE_KEY = /^[A-Za-z][A-Za-z0-9_]*-\d+$/;
const PROJECT_KEY = /^[A-Za-z][A-Za-z0-9_]*$/;
const LOOKS_LIKE_JQL = /[=~<>()]|\b(in|is|not|and|or|was|changed|order\s+by)\b/i;

/**
 * People type what they have to hand - an issue key, a project key, or real
 * JQL - into whichever box is closest. Turn the first two into valid JQL rather
 * than forwarding Jira's parser error back to them.
 */
export function toJql(input: string): string {
    const trimmed = input.trim().replace(/;+$/, '');
    if (LOOKS_LIKE_JQL.test(trimmed)) return trimmed;

    const tokens = trimmed.split(/[\s,]+/).filter(Boolean);

    // "SCRUM-5" or "SCRUM-5, SCRUM-3"
    if (tokens.length && tokens.every((t) => ISSUE_KEY.test(t))) {
        return `key in (${tokens.join(', ')})`;
    }
    // "SCRUM"
    if (tokens.length === 1 && PROJECT_KEY.test(tokens[0])) {
        return `project = "${tokens[0]}" ORDER BY updated DESC`;
    }
    // Anything else: hand it to Jira and let its error message do the talking.
    return trimmed;
}

/** The project-key box gets issue keys pasted into it too. */
export function projectJql(projectKey: string): string {
    const trimmed = projectKey.trim();
    if (ISSUE_KEY.test(trimmed)) return `key = ${trimmed}`;
    return `project = "${trimmed}" AND issuetype in (Story, Task, Bug) ORDER BY updated DESC`;
}

export async function fetchUserStories(
    config: JiraConfig,
    options: FetchStoriesOptions = {}
): Promise<UserStory[]> {
    const maxResults = Math.min(options.maxResults ?? 50, 100);
    const projectKey = options.projectKey || config.projectKey;

    const rawJql = options.jql?.trim();
    let jql: string;
    if (rawJql) {
        jql = toJql(rawJql);
    } else if (projectKey) {
        jql = projectJql(projectKey);
    } else {
        throw new Error('Provide a Jira project key or a JQL query to fetch stories.');
    }

    try {
        const issues = await search(config, jql, maxResults);
        return issues.map((issue: any) => toUserStory(issue, config.baseUrl));
    } catch (error: any) {
        const messages = error.response?.data?.errorMessages;
        if (error.response?.status === 400 && Array.isArray(messages)) {
            throw new Error(`Jira rejected the JQL: ${messages.join('; ')}`);
        }
        throw describeError(error, 'story search');
    }
}

export async function fetchUserStory(config: JiraConfig, key: string): Promise<UserStory> {
    try {
        const { data } = await client(config).get(`/rest/api/3/issue/${encodeURIComponent(key)}`, {
            params: { fields: FIELDS.join(',') },
        });
        return toUserStory(data, config.baseUrl);
    } catch (error: any) {
        throw describeError(error, `fetching issue ${key}`);
    }
}
