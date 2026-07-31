/**
 * End-to-end evidence run — the whole pipeline through the real HTTP API against
 * live Jira and a live model. No mocks.
 *
 *   npm run dev:api          (in another terminal)
 *   npm run e2e              or  npm run e2e -- --key SCRUM-5 --review
 *
 * Exits non-zero on any failure, so it can gate a deploy.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { args, env, heading, line, pass, fail } from './_env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

const flags = args();
const key = flags.key || env('JIRA_PROJECT_KEY', 'SCRUM') + '-5';
const base = flags.api || `http://localhost:${env('PORT', '5008')}`;
const withReview = Boolean(flags.review);
const context =
    flags.context ||
    'Staging is at https://staging.shop.example.com. Protect the guest-checkout regression from last release.';

const outDir = path.join(root, '.tmp');
mkdirSync(outDir, { recursive: true });

async function call<T>(route: string, body?: unknown): Promise<{ data: T; ms: number }> {
    const startedAt = Date.now();
    const response = await fetch(`${base}/api${route}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(env('APP_PASSWORD') ? { 'x-app-password': env('APP_PASSWORD') } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }).catch((error) => {
        fail(`Cannot reach ${base}${route} — is \`npm run dev:api\` running? (${error.message})`);
    });

    const text = await response.text();
    let payload: any;
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        fail(`${route} returned a non-JSON body (HTTP ${response.status}): ${text.slice(0, 200)}`);
    }
    if (!response.ok) fail(`${route} failed (HTTP ${response.status}): ${payload.error ?? text.slice(0, 200)}`);
    return { data: payload as T, ms: Date.now() - startedAt };
}

heading(`End-to-end pipeline — ${key} via ${base}`);

// --- S1-S3: fetch and normalise ---
const fetched = await call<any>('/connections/workitems', { id: key });
const items = fetched.data.items;
if (!items?.length) fail(`No work item came back for ${key}.`);

line('1 fetch', `${fetched.ms} ms · ${items.length} item(s)`);
line('  key', items[0].key);
line('  title', items[0].title);
line('  description', `${items[0].description.length} chars`);
line('  criteria', `${items[0].acceptanceCriteria.length} (${items[0].criteriaSource})`);

if (!items[0].acceptanceCriteria.length) {
    line('  note', 'no acceptance criteria — coverage will rest on the description');
}

// --- S4: analyze ---
const analyzed = await call<any>('/plan/analyze', {
    workItems: items,
    additionalContext: context,
});
const analysis = analyzed.data.analysis;

line('2 analyze', `${analyzed.ms} ms · ${analyzed.data.model.provider}/${analyzed.data.model.model}`);
line('  product', analysis.productName);
line('  features', analysis.features.length);
line('  objectives', analysis.testObjectives.length);
line('  exclusions', analysis.exclusions.length);
line('  risks', analysis.risks.length);
line('  openQuestions', analysis.openQuestions.length);

// Did the additional context actually reach the output? A context box the model
// ignores is worse than no context box, because the user believes it was used.
const contextUsed = JSON.stringify(analysis).includes('staging.shop.example.com');
line('  context used', contextUsed ? 'yes — the staging URL appears in the analysis' : 'NO — investigate');

// --- S5: cases ---
const derived = await call<any>('/plan/cases', {
    workItems: items,
    analysis,
    additionalContext: context,
});
const testCases = derived.data.testCases;

line('3 cases', `${derived.ms} ms · ${testCases.length} case(s)`);
for (const c of testCases) {
    line('  ', `${String(c.id).padEnd(18)} ${String(c.type).padEnd(14)} ${String(c.acceptanceCriterionRef ?? '—').padEnd(6)} ${c.title}`);
}

const ids = testCases.map((c: any) => c.id);
if (new Set(ids).size !== ids.length) fail('Duplicate test case ids came back.');

// --- S6: render (deterministic) ---
const template = readFileSync(path.join(root, 'templates/test_plan.md'), 'utf8');
const rendered = await call<any>('/plan/render', {
    template,
    workItems: items,
    analysis,
    testCases,
    meta: {
        author: 'Kd Singh',
        version: '1.0',
        environment: 'Staging',
        browser: 'Chrome',
        baseUrl: 'https://staging.shop.example.com',
    },
    additionalContext: context,
    generatedBy: `${analyzed.data.model.provider}/${analyzed.data.model.model}`,
});

const markdown: string = rendered.data.markdown;
const report = rendered.data.report;

line('4 render', `${rendered.ms} ms (no model call)`);
line('  length', `${markdown.length} chars, ${markdown.split('\n').length} lines`);
line('  placeholders', report.placeholders);
line('  defaulted', report.defaulted.length ? report.defaulted.join(', ') : 'none');
line('  none-identified', report.empty.length ? report.empty.join(', ') : 'none');
line('  coverage gaps', report.coverageGaps.length);
for (const gap of report.coverageGaps) line('  ', gap);

// The invariant that matters most: nothing unresolved ever ships.
const survivors = markdown.match(/\{\{[A-Z0-9_]+\}\}/g);
if (survivors) fail(`The rendered document still contains ${survivors.length} placeholder(s): ${survivors.join(', ')}`);
line('  unresolved', '0 — invariant 6 holds');

// The template's own structure must be intact.
const required = [
    '# 1. Objective',
    '# 2. Scope',
    '# 4. Exclusions',
    '# 5. Test Environments',
    '# 6. Defect Reporting Procedure',
    '# 7. Test Strategy',
    '# 8. Test Schedule',
    '# 9. Test Deliverables',
    '# 10. Entry and Exit Criteria',
    '# 11. Tools',
    '# 12. Risks and Mitigations',
    '# 13. Test Cases',
    '# 14. Assumptions and Open Questions',
    '# 15. Approvals',
];
const missing = required.filter((h) => !markdown.includes(h));
if (missing.length) fail(`The rendered plan is missing sections: ${missing.join(', ')}`);
line('  sections', `${required.length}/${required.length} present`);

// --- S7: review (optional) ---
let review: any[] | undefined;
if (withReview) {
    const reviewed = await call<any>('/plan/review', { markdown, workItems: items, testCases });
    review = reviewed.data.findings;
    line('5 review', `${reviewed.ms} ms · ${review!.length} finding(s)`);
    if (reviewed.data.dropped?.length) {
        line('  withheld', reviewed.data.dropped.join('; '));
    }
    for (const f of review!) line('  ', `${String(f.severity).padEnd(8)} ${f.section} — ${f.issue}`);
}

// --- share preview: what would be posted, without posting it ---
const plan = {
    id: 'e2e',
    workItemKeys: items.map((i: any) => i.key),
    templateId: 'builtin:test_plan',
    fidelity: 'strict',
    meta: { author: 'Kd Singh', version: '1.0', environment: 'Staging', browser: 'Chrome', baseUrl: '' },
    additionalContext: context,
    workItems: items,
    analysis,
    testCases,
    markdown,
    report,
    review,
    model: analyzed.data.model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shares: [],
};

const preview = await call<any>('/share/preview', { plan });
line('6 share preview', `${preview.ms} ms · ${preview.data.filename}`);
line('  comment', `${preview.data.markdown.length} chars (summary, not the whole plan)`);

writeFileSync(path.join(outDir, 'plan.md'), markdown, 'utf8');
writeFileSync(path.join(outDir, 'plan.json'), JSON.stringify(plan, null, 2), 'utf8');
writeFileSync(path.join(outDir, 'comment.md'), preview.data.markdown, 'utf8');

heading('Written to .tmp/');
line('plan.md', `${markdown.length} chars`);
line('plan.json', 'full audit trail');
line('comment.md', 'the Jira comment that would be posted');

const total = fetched.ms + analyzed.ms + derived.ms + rendered.ms;
pass(
    `${key} → ${testCases.length} cases → ${markdown.length}-char plan in ${(total / 1000).toFixed(1)}s. ` +
    `${report.coverageGaps.length} coverage gap(s) reported.`
);
