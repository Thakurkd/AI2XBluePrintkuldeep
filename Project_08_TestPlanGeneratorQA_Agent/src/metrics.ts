/**
 * Dashboard aggregation.
 *
 * Client-side by nature: plans live in this browser's local storage
 * (gemini.md §0 Q4), so the server never sees the corpus these numbers describe.
 *
 * Metrics are computed on read, never incremented by hand — a stored count and a
 * real count drift, and the stored one always wins in the UI while being wrong
 * (gemini.md §2.7).
 */
import type { TestCase, TestCaseStatus, TestPlan } from './types';
import { TEST_CASE_STATUSES } from './types';

export interface DashboardMetrics {
    totalTests: number;
    passed: number;
    failed: number;
    inProgress: number;
    /** Executed = passed + failed. The denominator for a pass rate that means something. */
    executed: number;
    passRate: number | null;
    byStatus: Record<TestCaseStatus, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byWorkItem: { key: string; total: number; passed: number; failed: number; blocked: number }[];
    plans: { total: number; shared: number; reviewed: number; withGaps: number };
}

export function computeMetrics(plans: TestPlan[]): DashboardMetrics {
    const cases: TestCase[] = plans.flatMap((p) => p.testCases ?? []);

    const byStatus = Object.fromEntries(TEST_CASE_STATUSES.map((s) => [s, 0])) as Record<
        TestCaseStatus,
        number
    >;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const c of cases) {
        byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
        byType[c.type] = (byType[c.type] ?? 0) + 1;
        byPriority[c.priority] = (byPriority[c.priority] ?? 0) + 1;
    }

    const perItem = new Map<
        string,
        { key: string; total: number; passed: number; failed: number; blocked: number }
    >();
    for (const c of cases) {
        const row = perItem.get(c.workItemKey) ?? {
            key: c.workItemKey,
            total: 0,
            passed: 0,
            failed: 0,
            blocked: 0,
        };
        row.total++;
        if (c.status === 'Passed') row.passed++;
        if (c.status === 'Failed') row.failed++;
        if (c.status === 'Blocked') row.blocked++;
        perItem.set(c.workItemKey, row);
    }

    const passed = byStatus.Passed;
    const failed = byStatus.Failed;
    const executed = passed + failed;

    return {
        totalTests: cases.length,
        passed,
        failed,
        // "In progress" reads as work underway: a case someone has picked up, plus
        // one that is stuck. A blocked case is not idle and should not look it.
        inProgress: byStatus.InProgress + byStatus.Blocked,
        executed,
        passRate: executed ? Math.round((passed / executed) * 100) : null,
        byStatus,
        byType,
        byPriority,
        byWorkItem: [...perItem.values()].sort((a, b) => b.total - a.total),
        plans: {
            total: plans.length,
            shared: plans.filter((p) => (p.shares ?? []).length > 0).length,
            reviewed: plans.filter((p) => p.review !== undefined).length,
            withGaps: plans.filter((p) => (p.report?.coverageGaps ?? []).length > 0).length,
        },
    };
}
