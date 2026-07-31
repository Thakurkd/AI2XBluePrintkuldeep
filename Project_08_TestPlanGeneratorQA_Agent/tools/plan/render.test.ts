/**
 * The renderer. Run: node --import tsx tools/plan/render.test.ts
 *
 * This is the file that makes the plan trustworthy: it must never leave a
 * placeholder in a document, never invent content for a load-bearing section, and
 * must report every default it fell back on.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { render, supportedPlaceholders, validateTemplate } from './render.js';
import { PlanAnalysis, TestCase, WorkItem } from '../../server/types.js';

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

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(path.resolve(here, '../../templates/test_plan.md'), 'utf8');

const workItem: WorkItem = {
    id: '1',
    key: 'SCRUM-5',
    source: 'jira',
    title: 'Customer can sign in',
    type: 'Story',
    status: 'To Do',
    priority: 'Medium',
    assignee: null,
    reporter: null,
    labels: [],
    components: [],
    description: 'desc',
    acceptanceCriteria: ['Valid credentials land on /account', 'A wrong password shows an error'],
    criteriaSource: 'description',
    links: [],
    url: 'https://example.atlassian.net/browse/SCRUM-5',
    fetchedAt: '2026-07-31T10:00:00.000Z',
};

/** A minimal but valid analysis: only the three required fields are populated. */
function analysis(overrides: Partial<PlanAnalysis> = {}): PlanAnalysis {
    return {
        productName: 'Storefront sign-in',
        targetAudience: 'registered customers',
        objectiveDetail: 'Prove sign-in works.',
        testObjectives: ['Prove valid credentials reach /account'],
        introduction: 'This plan covers sign-in.',
        features: [
            {
                workItemKey: 'SCRUM-5',
                feature: 'Email and password sign-in',
                riskLevel: 'H',
                priority: 'High',
                rationale: 'authentication',
            },
        ],
        testingTypes: [],
        evaluationCriteria: [],
        teamRoles: [],
        exclusions: [],
        environments: {
            operatingSystems: [],
            browsers: [],
            devices: [],
            network: [],
            hardwareRequirements: [],
            securityProtocols: [],
            accessPermissions: [],
            baseUrl: '',
        },
        defectCriteria: [],
        defectTrackingTool: '',
        communicationChannels: [],
        defectMetrics: [],
        testTechniques: [],
        smokeScope: '',
        e2eFlows: [],
        schedule: [],
        timeline: '',
        deliverables: [],
        entryExitCriteria: [],
        tools: [],
        risks: [],
        assumptions: [],
        openQuestions: [],
        ...overrides,
    };
}

function testCase(overrides: Partial<TestCase> = {}): TestCase {
    return {
        id: 'SCRUM-5-TC-001',
        workItemKey: 'SCRUM-5',
        acceptanceCriterionRef: 'AC-1',
        title: 'Sign in with valid credentials',
        type: 'Positive',
        priority: 'High',
        preconditions: ['A registered account exists'],
        steps: ['1. Open /login', '2. Enter valid credentials', '3. Click Sign in'],
        expectedResult: 'The customer lands on /account',
        testData: 'user@example.com / correct-horse',
        automatable: true,
        gaps: [],
        status: 'Draft',
        ...overrides,
    };
}

const base = {
    template: TEMPLATE,
    workItems: [workItem],
    meta: { author: 'Kd', version: '1.0', environment: 'QA', browser: 'Chrome', baseUrl: '' },
    generatedBy: 'groq/openai-gpt-oss-120b',
    generatedAt: '2026-07-31T10:00:00.000Z',
};

console.log('\nrender.ts — the shipped template');

test('the shipped template only uses placeholders the renderer can supply', () => {
    const check = validateTemplate(TEMPLATE);
    assert.deepEqual(check.unknown, [], `unknown placeholders: ${check.unknown.join(', ')}`);
    assert.ok(check.used.length > 30, `expected the full contract, saw ${check.used.length}`);
});

test('no unresolved placeholder ever ships — invariant 6', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    const survivors = markdown.match(/\{\{[A-Z0-9_]+\}\}/g);
    assert.equal(survivors, null, `left behind: ${survivors?.join(', ')}`);
});

test('the template’s own headings survive untouched — strict fidelity', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    for (const heading of [
        '# 1. Objective',
        '# 2. Scope',
        '# 4. Exclusions',
        '# 5. Test Environments',
        '# 6. Defect Reporting Procedure',
        '# 7. Test Strategy',
        '# 12. Risks and Mitigations',
        '# 15. Approvals',
    ]) {
        assert.ok(markdown.includes(heading), `missing heading: ${heading}`);
    }
});

test('boilerplate paragraphs are not rewritten', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    assert.ok(markdown.includes('Starting testing activities early in the development lifecycle.'));
    assert.ok(markdown.includes('**Approved By:** ___________________________'));
});

console.log('\nrender.ts — fallbacks and honesty');

test('empty boilerplate slots use documented defaults and are reported', () => {
    const { markdown, report } = render({ ...base, analysis: analysis(), testCases: [testCase()] });

    assert.ok(markdown.includes('Google Chrome'), 'browser default was not applied');
    assert.ok(markdown.includes('Windows 10'), 'OS default was not applied');
    assert.ok(report.defaulted.includes('BROWSERS'), 'the default was applied but not reported');
    assert.ok(report.defaulted.includes('OPERATING_SYSTEMS'));
    assert.ok(report.defaulted.length >= 5, `expected several defaults, got ${report.defaulted.length}`);
});

test('an empty non-required list renders as "none identified", never blank', () => {
    const { markdown, report } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    assert.ok(markdown.includes('_None identified._'));
    assert.ok(report.empty.includes('EXCLUSIONS'), `empty: ${report.empty.join(', ')}`);
});

test('a missing required section fails loudly instead of shipping platitudes', () => {
    assert.throws(
        () => render({ ...base, analysis: analysis({ features: [] }), testCases: [testCase()] }),
        /FEATURES/,
        'an empty features list must not produce a document'
    );
    assert.throws(
        () => render({ ...base, analysis: analysis({ productName: '' }), testCases: [testCase()] }),
        /PRODUCT_NAME/
    );
});

test('an unknown placeholder is an error naming it', () => {
    assert.throws(
        () =>
            render({
                ...base,
                template: '# Plan\n\n{{PRODUCT_NAME}} and {{NOT_A_REAL_SLOT}}',
                analysis: analysis(),
                testCases: [testCase()],
            }),
        /NOT_A_REAL_SLOT/
    );
});

console.log('\nrender.ts — content');

test('coverage gaps reach the document, not just the report', () => {
    // AC-2 has no case.
    const { markdown, report } = render({ ...base, analysis: analysis(), testCases: [testCase()] });

    assert.equal(report.coverageGaps.length, 1);
    assert.ok(
        markdown.includes('AC-2'),
        'an uncovered criterion must appear in the plan’s open questions, not only in a report'
    );
    assert.ok(markdown.includes('A wrong password shows an error'));
});

test('the coverage matrix marks covered and uncovered criteria differently', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    assert.ok(markdown.includes('✅ SCRUM-5-TC-001'), 'covered criterion not marked');
    assert.ok(markdown.includes('⚠ no case'), 'uncovered criterion not marked');
});

test('tables are real markdown tables with separator rows', () => {
    const { markdown } = render({
        ...base,
        analysis: analysis({
            risks: [{ risk: 'Flaky login', impact: 'High', likelihood: 'Medium', mitigation: 'Retry policy' }],
        }),
        testCases: [testCase()],
    });
    assert.ok(markdown.includes('| Risk | Impact | Likelihood | Mitigation |'));
    assert.ok(markdown.includes('| --- | --- | --- | --- |'));
    assert.ok(markdown.includes('| Flaky login | High | Medium | Retry policy |'));
});

test('a pipe in model output does not break the table', () => {
    const { markdown } = render({
        ...base,
        analysis: analysis({
            risks: [
                { risk: 'A | B ambiguity', impact: 'Low', likelihood: 'Low', mitigation: 'Clarify' },
            ],
        }),
        testCases: [testCase()],
    });
    assert.ok(markdown.includes('A \\| B ambiguity'), 'the pipe was not escaped');
});

test('case detail includes steps, expected result, and clarification needs', () => {
    const { markdown } = render({
        ...base,
        analysis: analysis(),
        testCases: [testCase({ gaps: ['The ticket does not name the error selector'] })],
    });
    assert.ok(markdown.includes('### SCRUM-5-TC-001 — Sign in with valid credentials'));
    assert.ok(markdown.includes('1. Open /login'));
    assert.ok(markdown.includes('The customer lands on /account'));
    assert.ok(markdown.includes('The ticket does not name the error selector'));
});

test('exclusions distinguish stated from inferred', () => {
    const { markdown } = render({
        ...base,
        analysis: analysis({
            exclusions: [
                { item: 'Social sign-in', basis: 'stated' },
                { item: 'Password reset', basis: 'inferred' },
            ],
        }),
        testCases: [testCase()],
    });
    assert.ok(markdown.includes('- Social sign-in\n'), 'a stated exclusion should carry no qualifier');
    assert.ok(markdown.includes('Password reset _(inferred, not stated)_'));
});

test('the tracker is named from the connector when the model leaves it blank', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    assert.ok(markdown.includes('Jira'), 'the defect tracker should be named');
});

test('provenance and the review caveat are in the document', () => {
    const { markdown } = render({ ...base, analysis: analysis(), testCases: [testCase()] });
    assert.ok(markdown.includes('SCRUM-5'), 'the source key must be recorded');
    assert.ok(markdown.includes(workItem.url), 'the document must link back to the ticket');
    assert.ok(
        markdown.includes('first draft that removes the blank page'),
        'the caveat that this needs review must survive'
    );
});

test('supportedPlaceholders lists the whole contract', () => {
    const names = supportedPlaceholders();
    for (const required of ['PRODUCT_NAME', 'FEATURES', 'RISK_TABLE', 'COVERAGE_MATRIX', 'OPEN_QUESTIONS']) {
        assert.ok(names.includes(required), `missing ${required}`);
    }
});

console.log(`\n${passed} passed\n`);
