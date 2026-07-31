/**
 * Link handshake 2.1 — Jira Cloud credentials.
 *
 * Proves: the token authenticates, and it belongs to the account we think it
 * does, against the site we think it does. `gemini.md` invariant 4 — "ok" is not
 * proof, so this prints the identity behind the credential.
 *
 * Also answers the Phase 2 discovery question in architecture/02_workitem_fetch.md:
 * does this site keep acceptance criteria in a custom field?
 *
 *   npm run link:jira
 */
import axios from 'axios';
import { env, required, heading, line, pass, fail, explain } from './_env.js';

const baseUrl = required('JIRA_BASE_URL').replace(/\/+$/, '');
const email = required('JIRA_EMAIL');
const apiToken = required('JIRA_API_TOKEN');
const projectKey = env('JIRA_PROJECT_KEY');

if (!/^https?:\/\//i.test(baseUrl)) {
    fail(`JIRA_BASE_URL must start with http(s)://, got "${baseUrl}"`);
}

const http = axios.create({
    baseURL: baseUrl,
    headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
        Accept: 'application/json',
    },
    timeout: 30_000,
});

heading(`Jira handshake — ${baseUrl}`);

// 1. Who does this token belong to?
let me: any;
try {
    ({ data: me } = await http.get('/rest/api/3/myself'));
} catch (error) {
    fail(explain(error, 'Jira /myself'));
}

line('account', me.displayName);
line('email', me.emailAddress ?? '(hidden by privacy settings)');
line('accountId', me.accountId);
line('timezone', me.timeZone ?? '—');

// 2. Which projects can it see? An empty list with valid credentials means the
//    token works but points somewhere useless, which is worth knowing now.
let projects: any[] = [];
try {
    const { data } = await http.get('/rest/api/3/project/search', {
        params: { maxResults: 50, orderBy: 'lastIssueUpdatedTime' },
    });
    projects = data.values ?? [];
} catch (error) {
    fail(explain(error, 'Jira project search'));
}

line('projects visible', projects.length);
for (const p of projects.slice(0, 10)) {
    line('', `${p.key.padEnd(10)} ${p.name}`);
}

if (projectKey && !projects.some((p) => p.key === projectKey)) {
    fail(
        `JIRA_PROJECT_KEY is "${projectKey}" but this account cannot see a project with that key. ` +
        `Visible: ${projects.map((p) => p.key).join(', ') || 'none'}`
    );
}

// 3. Discovery: is there a custom field for acceptance criteria on this site?
//    A structured field always beats scraping a heading out of the description
//    (architecture/02_workitem_fetch.md §Acceptance criteria).
heading('Acceptance-criteria field discovery');
try {
    const { data: fields } = await http.get('/rest/api/3/field');
    const candidates = (fields ?? []).filter((f: any) =>
        /acceptance|criteria|gherkin|given.?when.?then/i.test(f.name ?? '')
    );
    if (candidates.length === 0) {
        line('result', 'no custom field found — scrape the description instead');
        line('action', 'leave JIRA_AC_FIELD blank');
    } else {
        for (const f of candidates) {
            line(f.id, `${f.name}  (${f.schema?.type ?? 'unknown type'})`);
        }
        line('action', `set JIRA_AC_FIELD=${candidates[0].id} in .env`);
    }
} catch (error) {
    // Not fatal: /field needs broader permissions than reading issues, and the
    // description-scraping path works without it.
    line('result', `could not read /rest/api/3/field — ${explain(error, 'field list')}`);
    line('action', 'leave JIRA_AC_FIELD blank; description scraping is the fallback');
}

pass(`Jira reachable as ${me.displayName}, ${projects.length} project(s) visible.`);
