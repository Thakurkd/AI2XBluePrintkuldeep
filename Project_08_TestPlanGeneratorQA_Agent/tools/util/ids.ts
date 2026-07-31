/**
 * Test-case id assignment.
 *
 * The prompt does not ask the model for ids, because models duplicate numbers
 * across items and drift on format (findings.md §3, gemini.md invariant 7). Ids
 * are a formatting concern, and formatting is code's job.
 */
import { TestCase, TestCaseType, WorkItem } from '../../server/types.js';

const TYPES: TestCaseType[] = [
    'Positive',
    'Negative',
    'Boundary',
    'Security',
    'Accessibility',
    'Performance',
    'Usability',
];

const PRIORITIES = ['High', 'Medium', 'Low'] as const;

/** Coerce a model's near-miss enum to the nearest legal value rather than failing the run. */
function normaliseType(value: unknown): TestCaseType {
    const raw = String(value ?? '').toLowerCase();
    const match = TYPES.find((t) => t.toLowerCase() === raw);
    if (match) return match;
    if (/neg|invalid|error|fail/.test(raw)) return 'Negative';
    if (/bound|edge|limit/.test(raw)) return 'Boundary';
    if (/sec|auth|permission|privacy/.test(raw)) return 'Security';
    if (/access|a11y|wcag/.test(raw)) return 'Accessibility';
    if (/perf|load|stress/.test(raw)) return 'Performance';
    if (/usab|ux/.test(raw)) return 'Usability';
    return 'Positive';
}

function normalisePriority(value: unknown): 'High' | 'Medium' | 'Low' {
    const raw = String(value ?? '').toLowerCase();
    const match = PRIORITIES.find((p) => p.toLowerCase() === raw);
    if (match) return match;
    if (/crit|blocker|p0|p1|high/.test(raw)) return 'High';
    if (/low|minor|p3|p4|trivial/.test(raw)) return 'Low';
    return 'Medium';
}

/** "ac 2", "AC2", "Criterion 2" → "AC-2"; anything unrecognisable → null. */
function normaliseCriterionRef(value: unknown, criteriaCount: number): string | null {
    const raw = String(value ?? '').trim();
    if (!raw || /^(null|none|n\/a|-)$/i.test(raw)) return null;

    const n = raw.match(/(\d+)/);
    if (!n) return null;

    const index = Number(n[1]);
    // A reference past the end of the list is a hallucination, not a criterion.
    if (index < 1 || index > criteriaCount) return null;
    return `AC-${index}`;
}

/** Ensure steps read as a numbered list whatever the model emitted. */
function normaliseSteps(steps: unknown): string[] {
    if (!Array.isArray(steps)) return [];
    return steps
        .map((s) => String(s ?? '').trim())
        .filter(Boolean)
        .map((s, i) => {
            const withoutNumber = s.replace(/^\s*\d+[.)]\s*/, '');
            return `${i + 1}. ${withoutNumber}`;
        });
}

const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((v) => String(v ?? '').trim()).filter(Boolean) : [];

/**
 * Take the model's raw case objects and return validated `TestCase`s with
 * sequential ids per work item: SCRUM-5-TC-001, SCRUM-5-TC-002, …
 */
export function assignIds(raw: any[], items: WorkItem[]): TestCase[] {
    const byKey = new Map(items.map((i) => [i.key.toUpperCase(), i]));
    const fallbackKey = items[0]?.key ?? 'ITEM';
    const counters = new Map<string, number>();

    return raw
        .filter((c) => c && String(c.title ?? '').trim())
        .map((c) => {
            const suppliedKey = String(c.workItemKey ?? '').toUpperCase();
            const workItemKey = byKey.has(suppliedKey) ? byKey.get(suppliedKey)!.key : fallbackKey;
            const criteriaCount = byKey.get(workItemKey.toUpperCase())?.acceptanceCriteria.length ?? 0;

            const n = (counters.get(workItemKey) ?? 0) + 1;
            counters.set(workItemKey, n);

            return {
                id: `${workItemKey}-TC-${String(n).padStart(3, '0')}`,
                workItemKey,
                acceptanceCriterionRef: normaliseCriterionRef(c.acceptanceCriterionRef, criteriaCount),
                title: String(c.title).trim(),
                type: normaliseType(c.type),
                priority: normalisePriority(c.priority),
                preconditions: asStringArray(c.preconditions),
                steps: normaliseSteps(c.steps),
                expectedResult: String(c.expectedResult ?? '').trim(),
                testData: String(c.testData ?? '').trim(),
                automatable: c.automatable !== false,
                gaps: asStringArray(c.gaps),
                status: 'Draft' as const,
            };
        });
}

/**
 * Acceptance criteria with no test case. Reporting the gap is mandatory —
 * silently having fewer cases than criteria is not acceptable
 * (architecture/03_plan_generation.md §S5).
 */
export function coverageGaps(items: WorkItem[], testCases: TestCase[]): string[] {
    const gaps: string[] = [];

    for (const item of items) {
        const covered = new Set(
            testCases
                .filter((c) => c.workItemKey === item.key && c.acceptanceCriterionRef)
                .map((c) => c.acceptanceCriterionRef)
        );

        item.acceptanceCriteria.forEach((text, i) => {
            const ref = `AC-${i + 1}`;
            if (!covered.has(ref)) {
                const short = text.length > 90 ? `${text.slice(0, 87)}…` : text;
                gaps.push(`No test case was derived for ${item.key} ${ref} — "${short}". Review needed.`);
            }
        });

        if (!item.acceptanceCriteria.length) {
            const forItem = testCases.filter((c) => c.workItemKey === item.key).length;
            gaps.push(
                `${item.key} stated no acceptance criteria; its ${forItem} case(s) were derived from the description alone.`
            );
        }
    }
    return gaps;
}
