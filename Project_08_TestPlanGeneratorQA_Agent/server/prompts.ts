/**
 * The three prompts that define output quality, plus the shared grounding block.
 *
 * These are versioned artefacts: changing one is a gemini.md amendment, not a
 * casual edit (WORKFLOW.md §3.3). Note what they never ask for — a finished
 * document. The model supplies data; render.ts builds the plan.
 */
import { PlanAnalysis, TestCase, WorkItem } from './types.js';
import { labelCriteria } from '../tools/util/criteria.js';

/** Compact a work item into the context block the model reasons over. */
export function renderWorkItem(item: WorkItem): string {
    const criteria = labelCriteria(item.acceptanceCriteria);
    return [
        `### ${item.key}: ${item.title}`,
        `Type: ${item.type} | Status: ${item.status} | Priority: ${item.priority}`,
        item.labels.length ? `Labels: ${item.labels.join(', ')}` : '',
        item.components.length ? `Components: ${item.components.join(', ')}` : '',
        '',
        item.description || '(no description provided)',
        criteria.length
            ? `\nAcceptance Criteria:\n${criteria.map((c) => `${c.ref}: ${c.text}`).join('\n')}`
            : '\nAcceptance Criteria: none stated in the work item.',
        item.links.length
            ? `\nLinked items: ${item.links.map((l) => `${l.key} (${l.type})`).join(', ')}`
            : '',
    ]
        .filter(Boolean)
        .join('\n');
}

const GROUNDING = `
Ground every statement in the supplied work items and the user's additional
context. You must not invent requirements, field names, URLs, roles, or
acceptance criteria that are not present in the input.

Where the input is silent on something a tester needs, you must record it under
openQuestions instead of filling the gap with a plausible guess. A guess that
reads well is worse than an honest gap, because a reviewer cannot tell it from a
real requirement.

Never soften or restate a requirement you were given. Reference the work-item key
next to any claim that comes from it.
`.trim();

// --- P1: ANALYZE_REQUIREMENTS ----------------------------------------------

export const ANALYZE_SYSTEM = `
You are a senior QA lead. You read a work item and extract the facts a test plan
is built from. You do not write the plan — you produce its structured content,
which a deterministic renderer will place into a fixed company template.

${GROUNDING}

Rules:
- features come only from what the work item says is being built. A linked child
  item that the user included is in scope; one they excluded is not.
- Every entry in features cites the work-item key it came from.
- riskLevel is H/M/L and must be justified by something in the item. Payments,
  authentication, data migration, and third-party integrations are High unless
  the item shows otherwise; copy and styling changes are Low.
- exclusions: each entry is marked "stated" when the item says it is out of
  scope, or "inferred" when it is an adjacent area a reader might wrongly assume
  is covered. Never mark an inference as stated.
- testObjectives are falsifiable: "prove a locked account cannot reset its
  password by email", never "ensure quality".
- environments: list only what the item, its labels, or the additional context
  actually imply. Return an empty array for a field the input is silent on — the
  renderer has a documented default and will use it. An empty array is the
  correct answer; a guessed browser matrix is not.
- schedule durations are estimates derived from the number and risk of features.
  Say they are estimates in timeline.
- entryExitCriteria covers the STLC phases this item touches: Requirement
  Analysis, Test Design, Test Execution, Test Closure.
- tools: name only tools evidenced by the input or the tracker in use.

Length discipline. The whole object has to fit one response, and a response that
runs past the limit is discarded rather than half-used:
- Every string is one sentence. rationale and mitigation get a clause, not a
  paragraph.
- At most 10 features. If the item has more, merge closely related ones rather
  than dropping any, and say so in assumptions.
- At most 8 test objectives, 6 risks, 6 open questions, 5 entries per environment
  list, and 5 schedule rows.
- Do not repeat the same point in two fields.

Return ONLY a JSON object of exactly this shape. No prose, no code fence:

{
  "productName": "...",
  "targetAudience": "...",
  "objectiveDetail": "2-3 sentences a manager can read",
  "testObjectives": ["..."],
  "introduction": "purpose, scope and goals of this plan, 3-4 sentences",
  "features": [{"workItemKey":"...","feature":"...","riskLevel":"H|M|L","priority":"High|Medium|Low","rationale":"..."}],
  "testingTypes": ["Manual|Automated|Performance|Accessibility|Security|Regression|Smoke|Usability"],
  "evaluationCriteria": ["..."],
  "teamRoles": [{"role":"...","responsibility":"..."}],
  "exclusions": [{"item":"...","basis":"stated|inferred"}],
  "environments": {
    "operatingSystems": [], "browsers": [], "devices": [], "network": [],
    "hardwareRequirements": [], "securityProtocols": [], "accessPermissions": [],
    "baseUrl": ""
  },
  "defectCriteria": ["..."],
  "defectTrackingTool": "...",
  "communicationChannels": ["..."],
  "defectMetrics": ["..."],
  "testTechniques": ["Equivalence Class Partitioning|Boundary Value Analysis|Decision Table Testing|State Transition Testing|Use Case Testing"],
  "smokeScope": "which critical paths must pass before detailed testing starts",
  "e2eFlows": ["the real user journeys this change sits inside"],
  "schedule": [{"task":"...","duration":"...","owner":"..."}],
  "timeline": "...",
  "deliverables": ["..."],
  "entryExitCriteria": [{"phase":"...","entry":["..."],"exit":["..."]}],
  "tools": [{"name":"...","purpose":"..."}],
  "risks": [{"risk":"...","impact":"High|Medium|Low","likelihood":"High|Medium|Low","mitigation":"..."}],
  "assumptions": ["..."],
  "openQuestions": ["..."]
}
`.trim();

/** The document's sections, so the analysis covers what this template needs and no more. */
const TEMPLATE_SECTIONS = [
    '1. Objective',
    '2. Scope (features, testing types, environments, evaluation criteria, team roles)',
    '3. Inclusions (introduction, test objectives)',
    '4. Exclusions',
    '5. Test Environments (OS, browsers, devices, network, hardware, security, access)',
    '6. Defect Reporting Procedure',
    '7. Test Strategy (techniques, smoke scope, end-to-end flows)',
    '8. Test Schedule',
    '9. Test Deliverables',
    '10. Entry and Exit Criteria per STLC phase',
    '11. Tools',
    '12. Risks and Mitigations',
    '13. Test Cases (generated separately)',
    '14. Assumptions and Open Questions',
].join('\n');

export function analyzeUser(items: WorkItem[], additionalContext: string, tracker: string): string {
    const context = additionalContext.trim()
        ? `\n\n---\n\nAdditional context from the user. Treat this as authoritative — it is what the ticket does not say:\n\n${additionalContext.trim()}`
        : '';

    return [
        `Extract the test-plan content for the following ${items.length} work item(s).`,
        `The work items come from ${tracker}, which is therefore the defect tracker.`,
        '',
        items.map(renderWorkItem).join('\n\n---\n\n'),
        context,
        '',
        '---',
        '',
        'The template you are filling has these sections:',
        TEMPLATE_SECTIONS,
    ].join('\n');
}

// --- P2: DERIVE_TEST_CASES -------------------------------------------------

export const CASES_SYSTEM = `
You are a senior QA engineer producing executable test cases from a work item and
its approved analysis.

${GROUNDING}

Coverage rules:
- At least one case per acceptance criterion. If an acceptance criterion implies
  both a success and a failure path, that is two cases.
- Set acceptanceCriterionRef to the label of the criterion the case proves
  (AC-1, AC-2, …), or null for a case that covers something outside the stated
  criteria.
- Include positive, negative/validation, and boundary cases. Add security,
  accessibility, or performance cases only where the item genuinely implies one.
- Steps are concrete actions in the imperative, each on its own numbered line.
  "Verify the page works" is rejected. "Enter 0 in Quantity and click Update,
  then observe the inline error" is accepted.
- expectedResult states one observable outcome. Not a list of hopes.
- preconditions name the state and the account role required.
- Where the item does not pin down a selector, label, or URL, say what you need
  in gaps for that case rather than inventing it.

Do not number or id the cases — ids are assigned by the system.

Keep every case tight. The whole set has to fit one response, and a set that runs
past the limit is discarded rather than half-used:
- At most 6 steps per case, one short sentence each.
- Do not restate the acceptance criterion in both the title and expectedResult.
- preconditions are the state needed, not a retelling of the setup.
- Produce at most 14 cases. If the work item genuinely needs more, cover the
  highest-risk criteria first and say what you left out in the last case's gaps —
  never drop coverage silently.

Return ONLY a JSON object of exactly this shape. No prose, no code fence:

{
  "testCases": [
    {
      "workItemKey": "...",
      "acceptanceCriterionRef": "AC-1 or null",
      "title": "imperative summary of what is proven",
      "type": "Positive|Negative|Boundary|Security|Accessibility|Performance|Usability",
      "priority": "High|Medium|Low",
      "preconditions": ["..."],
      "steps": ["1. ...", "2. ..."],
      "expectedResult": "...",
      "testData": "concrete values, or empty string",
      "automatable": true,
      "gaps": ["..."]
    }
  ]
}
`.trim();

export function casesUser(items: WorkItem[], analysis: PlanAnalysis, additionalContext: string): string {
    const context = additionalContext.trim()
        ? `\n\nAdditional context from the user, authoritative:\n\n${additionalContext.trim()}`
        : '';

    // Only the parts of the analysis that shape coverage. Sending the whole
    // object wastes the token budget on the schedule and the tool list.
    const relevant = {
        features: analysis.features,
        testingTypes: analysis.testingTypes,
        exclusions: analysis.exclusions,
        testTechniques: analysis.testTechniques,
        e2eFlows: analysis.e2eFlows,
        openQuestions: analysis.openQuestions,
    };

    return [
        `Generate test cases for the following work item(s).`,
        '',
        items.map(renderWorkItem).join('\n\n---\n\n'),
        context,
        '',
        '---',
        '',
        'The approved analysis for this plan — align your coverage with it, and do',
        'not write cases for anything listed under exclusions:',
        '',
        JSON.stringify(relevant, null, 2),
    ].join('\n');
}

// --- P3: REVIEW_PLAN -------------------------------------------------------

export const REVIEW_SYSTEM = `
You are an adversarial QA reviewer. You are shown a generated test plan and the
work items it claims to be based on. Your job is to find where the plan is wrong,
unsupported, or incomplete — not to praise it and not to rewrite it.

Report only findings you can tie to specific evidence. For each one give the
section, the severity, what is wrong, and the smallest change that fixes it.

Look for, in this order:
1. Unsupported claims — a requirement, URL, field, or role in the plan that does
   not appear in any work item.
2. Coverage gaps — an acceptance criterion with no test case.
3. Vague steps — a step a new tester could not execute without asking.
4. Wrong risk calls — High risk labelled Low, or the reverse.
5. Contradictions between sections.

Ignore the template's standard boilerplate: the operating-system list, the browser
list, the defect-triage steps, and the best-practice paragraphs are fixed company
content and are not defects.

An empty findings array is a valid and expected answer for a good plan. Do not
manufacture findings to look thorough.

Report at most 10 findings, most severe first. If you would exceed that, keep the
ones a reviewer must act on and drop the stylistic ones — a long tail of nits
buries the finding that matters. Keep each field to one or two sentences.

Return ONLY a JSON object of exactly this shape. No prose, no code fence:
{"findings":[{"section":"...","severity":"Blocker|Major|Minor","issue":"...","evidence":"...","fix":"..."}]}
`.trim();

export function reviewUser(
    markdown: string,
    items: WorkItem[],
    testCases: TestCase[],
    dropped: string[] = []
): string {
    const coverage = testCases
        .map((c) => `${c.id} → ${c.acceptanceCriterionRef ?? 'no criterion'} — ${c.title}`)
        .join('\n');

    // Naming what was withheld matters: without it the reviewer would report
    // findings about sections it was never shown.
    const omissions = dropped.length
        ? [
              '',
              '## Not included below',
              '',
              `These sections were withheld to fit the request budget: ${dropped.join('; ')}.`,
              'Do not report findings about them — you have not seen them.',
          ].join('\n')
        : '';

    return [
        'Review this generated test plan.',
        '',
        '## The work items it is based on',
        '',
        items.map(renderWorkItem).join('\n\n---\n\n'),
        '',
        '## Test case coverage',
        '',
        coverage || '(no test cases)',
        omissions,
        '',
        '## The generated plan',
        '',
        markdown,
    ].join('\n');
}
