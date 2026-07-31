/**
 * The deterministic renderer — SOP architecture/03_plan_generation.md §S6.
 *
 * No LLM. Given a template and the analysis, this produces the same document
 * every time, in the template's own section order, with its boilerplate
 * untouched. This is what stops plan structure from drifting between runs
 * (gemini.md invariant 1).
 *
 * The template arrives with the request rather than being read from disk: it is
 * user-editable state, and a serverless function has no dependable filesystem.
 */
import {
    PlanAnalysis,
    PlanMeta,
    RenderReport,
    TestCase,
    WorkItem,
} from '../../server/types.js';
import { coverageGaps } from '../util/ids.js';

const PLACEHOLDER = /\{\{([A-Z0-9_]+)\}\}/g;

/** Rendered in place of an empty list. A blank section reads as an oversight. */
const NONE = '_None identified._';

// --- formatters -------------------------------------------------------------

const bullets = (items: string[]): string =>
    items.filter((i) => i?.trim()).map((i) => `- ${i.trim()}`).join('\n');

function table(headers: string[], rows: string[][]): string {
    if (!rows.length) return '';
    const escape = (cell: string) => (cell ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
    return [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((r) => `| ${r.map(escape).join(' | ')} |`),
    ].join('\n');
}

const RISK_WORD: Record<string, string> = { H: 'High', M: 'Medium', L: 'Low' };

function casesSummary(testCases: TestCase[], analysis: PlanAnalysis): string {
    if (!testCases.length) return NONE;
    const byType = new Map<string, number>();
    for (const c of testCases) byType.set(c.type, (byType.get(c.type) ?? 0) + 1);
    const breakdown = [...byType.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type, n]) => `${n} ${type.toLowerCase()}`)
        .join(', ');
    const featureCount = analysis.features.length;
    return `${testCases.length} test case${testCases.length === 1 ? '' : 's'} across ${featureCount} feature${
        featureCount === 1 ? '' : 's'
    } — ${breakdown}.`;
}

function coverageMatrix(items: WorkItem[], testCases: TestCase[]): string {
    const rows: string[][] = [];

    for (const item of items) {
        if (!item.acceptanceCriteria.length) {
            rows.push([item.key, '—', 'no criteria stated', '⚠ derived from description']);
            continue;
        }
        item.acceptanceCriteria.forEach((text, i) => {
            const ref = `AC-${i + 1}`;
            const covering = testCases
                .filter((c) => c.workItemKey === item.key && c.acceptanceCriterionRef === ref)
                .map((c) => c.id);
            rows.push([
                item.key,
                ref,
                text.length > 110 ? `${text.slice(0, 107)}…` : text,
                covering.length ? `✅ ${covering.join(', ')}` : '⚠ no case',
            ]);
        });
    }
    if (!rows.length) return NONE;
    return `**Coverage matrix**\n\n${table(['Work item', 'AC', 'Acceptance criterion', 'Covered by'], rows)}`;
}

function casesDetail(testCases: TestCase[]): string {
    if (!testCases.length) return NONE;

    return testCases
        .map((c) => {
            const parts = [
                `### ${c.id} — ${c.title}`,
                '',
                `**Type:** ${c.type} · **Priority:** ${c.priority} · **Covers:** ${
                    c.acceptanceCriterionRef ?? 'no stated criterion'
                } · **Automatable:** ${c.automatable ? 'yes' : 'no'}`,
                '',
                '**Preconditions**',
                c.preconditions.length ? bullets(c.preconditions) : '- None',
                '',
                '**Steps**',
                c.steps.length ? c.steps.join('\n') : '_No steps were generated — review this case._',
                '',
                `**Expected result:** ${c.expectedResult || '_not stated — review this case._'}`,
            ];
            if (c.testData) parts.push('', `**Test data:** ${c.testData}`);
            // Gaps are the model saying "the ticket did not tell me this". Surfacing
            // them is the whole point; hiding them would make the case look complete.
            if (c.gaps.length) parts.push('', '**Needs clarification before execution**', bullets(c.gaps));
            return parts.join('\n');
        })
        .join('\n\n');
}

// --- fallbacks --------------------------------------------------------------

/**
 * The template's deliberate boilerplate. Used when the analysis is silent, and
 * every use is recorded in `report.defaulted` so a reviewer knows this content
 * came from the template rather than the ticket.
 */
const DEFAULTS: Record<string, string[]> = {
    OPERATING_SYSTEMS: ['Windows 10', 'macOS', 'Linux'],
    BROWSERS: ['Google Chrome', 'Mozilla Firefox', 'Microsoft Edge', 'Safari'],
    DEVICES: ['Desktop computers', 'Laptops', 'Tablets', 'Smartphones'],
    NETWORK: ['Wi-Fi', 'Cellular networks', 'Wired connections'],
    HARDWARE_REQUIREMENTS: [
        'Minimum processor requirements',
        'Memory requirements',
        'Storage capacity requirements',
    ],
    SECURITY_PROTOCOLS: ['Password authentication', 'Tokens', 'Certificates'],
    ACCESS_PERMISSIONS: ['Testers', 'Developers', 'Stakeholders', 'Administrators'],
    DEFECT_CRITERIA: [
        'Deviation from requirements',
        'User experience issues',
        'Technical errors or crashes',
    ],
    COMMUNICATION_CHANNELS: ['Daily stand-ups', 'Status emails', 'Project dashboards'],
    DEFECT_METRICS: [
        'Number of defects found',
        'Time taken to resolve defects',
        'Percentage of defects fixed',
    ],
    TEST_TECHNIQUES: [
        'Equivalence Class Partitioning',
        'Boundary Value Analysis',
        'Decision Table Testing',
        'State Transition Testing',
        'Use Case Testing',
    ],
    DELIVERABLES: [
        'Test Plan Document',
        'Test Scenarios',
        'Test Cases',
        'Defect Reports',
        'Test Execution Reports',
        'Test Summary Reports',
    ],
    EVALUATION_CRITERIA: [
        'Number of defects found',
        'Time taken to complete testing',
        'User satisfaction ratings',
    ],
    TESTING_TYPES: ['Manual Testing', 'Automated Testing', 'Performance Testing', 'Accessibility Testing'],
};

const DEFAULT_TEAM_ROLES: { role: string; responsibility: string }[] = [
    { role: 'Test Lead', responsibility: 'Plans the effort, reviews and prioritises defects' },
    { role: 'Testers', responsibility: 'Execute test cases and log defects' },
    { role: 'Developers', responsibility: 'Fix defects and support environment issues' },
    { role: 'Stakeholders', responsibility: 'Approve scope and sign off on exit criteria' },
];

/**
 * Placeholders that ARE the plan. If these are empty, generation failed and the
 * honest response is an error rather than a document full of platitudes.
 * Deliberately short: an empty exclusions or risk list is plausible for a small
 * ticket, so those render as "None identified" instead of blocking the run.
 */
const REQUIRED = ['PRODUCT_NAME', 'FEATURES', 'TEST_OBJECTIVES'];

// --- rendering --------------------------------------------------------------

export interface RenderInput {
    template: string;
    workItems: WorkItem[];
    analysis: PlanAnalysis;
    testCases: TestCase[];
    meta: PlanMeta;
    additionalContext?: string;
    generatedBy: string;
    generatedAt?: string;
}

/** Every placeholder the renderer can supply — gemini.md §2.8. */
function values(input: RenderInput): Record<string, string> {
    const { analysis: a, workItems, testCases, meta } = input;
    const generatedAt = input.generatedAt ?? new Date().toISOString();
    const env = a.environments ?? ({} as PlanAnalysis['environments']);

    const trackers = [...new Set(workItems.map((i) => (i.source === 'jira' ? 'Jira' : i.source)))].join(', ');

    return {
        // meta
        AUTHOR: meta.author || '[Your Name]',
        DATE: generatedAt.slice(0, 10),
        VERSION: meta.version || '1.0',
        GENERATED_BY: input.generatedBy,
        GENERATED_AT: generatedAt.replace('T', ' ').slice(0, 16),

        // provenance
        WORK_ITEM_KEYS: workItems.map((i) => i.key).join(', '),
        WORK_ITEM_LINKS: workItems.map((i) => `[${i.key}](${i.url}) — ${i.title}`).join(' · '),

        // §1
        PRODUCT_NAME: a.productName?.trim() || '',
        TARGET_AUDIENCE: a.targetAudience?.trim() || 'the application’s end users',
        OBJECTIVE_DETAIL: a.objectiveDetail?.trim() || '',
        TEST_OBJECTIVES: bullets(a.testObjectives ?? []),
        INTRODUCTION: a.introduction?.trim() || '',

        // §2
        FEATURES: table(
            ['Work item', 'Feature', 'Risk', 'Priority', 'Why'],
            (a.features ?? []).map((f) => [
                f.workItemKey,
                f.feature,
                RISK_WORD[f.riskLevel] ?? String(f.riskLevel ?? ''),
                f.priority,
                f.rationale,
            ])
        ),
        TESTING_TYPES: bullets(a.testingTypes ?? []),
        ENVIRONMENTS_SUMMARY:
            [env.browsers?.length ? `Browsers: ${env.browsers.join(', ')}` : '', env.baseUrl ? `URL: ${env.baseUrl}` : '']
                .filter(Boolean)
                .join(' · ') || 'Testing across the supported browsers, operating systems, and device types listed in section 5.',
        EVALUATION_CRITERIA: bullets(a.evaluationCriteria ?? []),
        TEAM_ROLES: bullets(
            (a.teamRoles?.length ? a.teamRoles : []).map((r) => `**${r.role}** — ${r.responsibility}`)
        ),

        // §4
        EXCLUSIONS: bullets(
            (a.exclusions ?? []).map((e) => `${e.item}${e.basis === 'inferred' ? ' _(inferred, not stated)_' : ''}`)
        ),

        // §5
        OPERATING_SYSTEMS: bullets(env.operatingSystems ?? []),
        BROWSERS: bullets(env.browsers ?? []),
        DEVICES: bullets(env.devices ?? []),
        NETWORK: bullets(env.network ?? []),
        HARDWARE_REQUIREMENTS: bullets(env.hardwareRequirements ?? []),
        SECURITY_PROTOCOLS: bullets(env.securityProtocols ?? []),
        ACCESS_PERMISSIONS: bullets(env.accessPermissions ?? []),
        BASE_URL: env.baseUrl || meta.baseUrl || '_not specified in the work item_',

        // §6
        DEFECT_CRITERIA: bullets(a.defectCriteria ?? []),
        DEFECT_TRACKING_TOOL: a.defectTrackingTool?.trim() || trackers || 'Jira',
        COMMUNICATION_CHANNELS: bullets(a.communicationChannels ?? []),
        DEFECT_METRICS: bullets(a.defectMetrics ?? []),

        // §7
        TEST_TECHNIQUES: bullets(a.testTechniques ?? []),
        SMOKE_SCOPE:
            a.smokeScope?.trim() ||
            'Verify that the critical paths in section 2 work before detailed testing begins.',
        E2E_FLOWS: bullets(a.e2eFlows ?? []),

        // §8
        SCHEDULE_TABLE: table(
            ['Task', 'Estimated duration', 'Owner'],
            (a.schedule ?? []).map((s) => [s.task, s.duration, s.owner || 'Test Lead'])
        ),
        TIMELINE: a.timeline?.trim() || 'Start and end dates to be confirmed with the release schedule.',

        // §9
        DELIVERABLES: bullets(a.deliverables ?? []),

        // §10
        ENTRY_EXIT_CRITERIA: (a.entryExitCriteria ?? [])
            .map((p) =>
                [
                    `## ${p.phase}`,
                    '',
                    '**Entry Criteria:**',
                    p.entry?.length ? bullets(p.entry) : '- Not specified',
                    '',
                    '**Exit Criteria:**',
                    p.exit?.length ? bullets(p.exit) : '- Not specified',
                ].join('\n')
            )
            .join('\n\n---\n\n'),

        // §11
        TOOLS: bullets((a.tools ?? []).map((t) => `**${t.name}** — ${t.purpose}`)),

        // §12
        RISK_TABLE: table(
            ['Risk', 'Impact', 'Likelihood', 'Mitigation'],
            (a.risks ?? []).map((r) => [r.risk, r.impact, r.likelihood, r.mitigation])
        ),

        // §13
        TEST_CASES_SUMMARY: casesSummary(testCases, a),
        TEST_CASES_TABLE: table(
            ['ID', 'Title', 'Type', 'Priority', 'Covers', 'Auto'],
            testCases.map((c) => [
                c.id,
                c.title,
                c.type,
                c.priority,
                c.acceptanceCriterionRef ?? '—',
                c.automatable ? 'yes' : 'no',
            ])
        ),
        TEST_CASES_DETAIL: casesDetail(testCases),
        COVERAGE_MATRIX: coverageMatrix(workItems, testCases),

        // §14 — coverage gaps join the open questions rather than sitting in a
        // report nobody opens. An uncovered acceptance criterion is exactly the
        // kind of thing this section exists to surface (SOP 03 §S5).
        ASSUMPTIONS: bullets(a.assumptions ?? []),
        OPEN_QUESTIONS: bullets([...(a.openQuestions ?? []), ...coverageGaps(workItems, testCases)]),

        ADDITIONAL_CONTEXT: input.additionalContext?.trim() || '',
        WORK_ITEM_SUMMARY: workItems.map((i) => `${i.key}: ${i.title}`).join('\n'),
    };
}

/** Placeholder names this renderer can supply. */
export function supportedPlaceholders(): string[] {
    const stub: RenderInput = {
        template: '',
        workItems: [],
        analysis: {} as PlanAnalysis,
        testCases: [],
        meta: { author: '', version: '', environment: '', browser: '', baseUrl: '' },
        generatedBy: '',
    };
    return Object.keys(values(stub)).sort();
}

export function extractPlaceholders(template: string): string[] {
    return [...new Set([...template.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

/**
 * Validate a template before it is saved, not when it is used. An unknown
 * placeholder is a save-time error rather than a runtime surprise
 * (architecture/05_ui_spec.md §Templates).
 */
export function validateTemplate(template: string): { ok: boolean; unknown: string[]; used: string[] } {
    const supported = new Set(supportedPlaceholders());
    const used = extractPlaceholders(template);
    const unknown = used.filter((p) => !supported.has(p));
    return { ok: unknown.length === 0, unknown, used };
}

export interface RenderOutput {
    markdown: string;
    report: RenderReport;
}

export function render(input: RenderInput): RenderOutput {
    const resolved = values(input);
    const used = extractPlaceholders(input.template);

    const unknown = used.filter((p) => !(p in resolved));
    if (unknown.length) {
        throw Object.assign(
            new Error(
                `The template uses ${unknown.length} placeholder(s) this renderer cannot supply: ${unknown.join(', ')}. ` +
                `Fix the template in Templates.`
            ),
            { status: 400 }
        );
    }

    const defaulted: string[] = [];
    const empty: string[] = [];
    const missingRequired: string[] = [];

    for (const name of used) {
        if (resolved[name]?.trim()) continue;

        if (REQUIRED.includes(name)) {
            missingRequired.push(name);
            continue;
        }
        if (DEFAULTS[name]) {
            resolved[name] = bullets(DEFAULTS[name]);
            defaulted.push(name);
            continue;
        }
        if (name === 'TEAM_ROLES') {
            resolved[name] = bullets(DEFAULT_TEAM_ROLES.map((r) => `**${r.role}** — ${r.responsibility}`));
            defaulted.push(name);
            continue;
        }
        resolved[name] = NONE;
        empty.push(name);
    }

    if (missingRequired.length) {
        throw Object.assign(
            new Error(
                `Generation produced nothing for ${missingRequired.join(', ')}, which is the substance of the plan. ` +
                `Re-run the analysis, or try a stronger model.`
            ),
            { status: 502 }
        );
    }

    const markdown = input.template.replace(PLACEHOLDER, (_match, name: string) => resolved[name] ?? '');

    // Invariant 6: no unresolved placeholder ever ships.
    const survivors = extractPlaceholders(markdown);
    if (survivors.length) {
        throw Object.assign(
            new Error(`Render left ${survivors.length} unresolved placeholder(s): ${survivors.join(', ')}.`),
            { status: 500 }
        );
    }

    return {
        markdown: markdown.replace(/\n{4,}/g, '\n\n\n').trim(),
        report: {
            defaulted,
            empty,
            placeholders: used.length,
            coverageGaps: coverageGaps(input.workItems, input.testCases),
        },
    };
}
