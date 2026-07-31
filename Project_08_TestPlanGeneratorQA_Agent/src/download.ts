import type { TestPlan } from './types';

function save(filename: string, body: string, mime: string) {
    const url = URL.createObjectURL(new Blob([body], { type: `${mime};charset=utf-8` }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

const stamp = (plan: TestPlan) =>
    `${plan.workItemKeys[0] ?? 'plan'}_v${plan.meta.version || '1.0'}_${plan.createdAt.slice(0, 10)}`;

export function downloadMarkdown(plan: TestPlan) {
    save(`TestPlan_${stamp(plan)}.md`, plan.markdown, 'text/markdown');
}

/**
 * The audit trail: which model produced this plan, from which work item, with what
 * additional context, when. Without it, "where did this plan come from?" has no
 * answer six weeks later.
 */
export function downloadJson(plan: TestPlan) {
    save(`TestPlan_${stamp(plan)}.json`, JSON.stringify(plan, null, 2), 'application/json');
}

const csvCell = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Test cases only, one row per case, for import into a test manager. */
export function downloadCsv(plan: TestPlan) {
    const headers = [
        'ID',
        'Work item',
        'Covers',
        'Title',
        'Type',
        'Priority',
        'Status',
        'Automatable',
        'Preconditions',
        'Steps',
        'Expected result',
        'Test data',
        'Gaps',
    ];

    const rows = plan.testCases.map((c) =>
        [
            c.id,
            c.workItemKey,
            c.acceptanceCriterionRef ?? '',
            c.title,
            c.type,
            c.priority,
            c.status,
            c.automatable ? 'yes' : 'no',
            c.preconditions.join(' | '),
            c.steps.join(' | '),
            c.expectedResult,
            c.testData,
            c.gaps.join(' | '),
        ].map(csvCell)
    );

    save(
        `TestCases_${stamp(plan)}.csv`,
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'),
        'text/csv'
    );
}
