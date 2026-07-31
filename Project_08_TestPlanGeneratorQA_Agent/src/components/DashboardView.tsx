import { computeMetrics } from '../metrics';
import { useStore } from '../store';
import type { TestPlan } from '../types';
import StatusBarChart from './StatusBarChart';
import { Badge, EmptyState, PageHeader, Panel, StatTile } from './ui';

export default function DashboardView({
    onOpenPlan,
    onGenerate,
}: {
    onOpenPlan: (id: string) => void;
    onGenerate: () => void;
}) {
    const { plans } = useStore();
    const m = computeMetrics(plans);

    if (!plans.length) {
        return (
            <>
                <PageHeader
                    title="Test plan dashboard"
                    subtitle="Coverage and outcomes across every plan generated in this browser."
                />
                <Panel>
                    <EmptyState
                        title="No plans yet"
                        hint="Generate one from a Jira key and its test cases, coverage, and outcomes appear here."
                        action={
                            <button type="button" className="btn btn-primary" onClick={onGenerate}>
                                Generate a plan →
                            </button>
                        }
                    />
                </Panel>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Test plan dashboard"
                subtitle="Coverage and outcomes across every plan generated in this browser. Counts come from the status you set on each case."
            />

            <div className="stat-row">
                <StatTile
                    label="Total tests"
                    value={m.totalTests}
                    sub={`across ${m.plans.total} plan${m.plans.total === 1 ? '' : 's'}`}
                />
                <StatTile
                    label="Tests passed"
                    value={m.passed}
                    sub={m.passRate === null ? 'nothing executed yet' : `${m.passRate}% of ${m.executed} executed`}
                    tone="good"
                />
                <StatTile
                    label="Tests failed"
                    value={m.failed}
                    sub={
                        m.executed
                            ? `${Math.round((m.failed / m.executed) * 100)}% of ${m.executed} executed`
                            : 'nothing executed yet'
                    }
                    tone="critical"
                />
                <StatTile
                    label="In progress"
                    value={m.inProgress}
                    sub={`${m.byStatus.Blocked} blocked · ${m.byStatus.Draft} still draft`}
                    tone="warning"
                />
            </div>

            <Panel>
                <StatusBarChart byStatus={m.byStatus} total={m.totalTests} />
            </Panel>

            {m.byWorkItem.length > 1 && (
                <Panel title="Coverage by work item">
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th scope="col">Work item</th>
                                    <th scope="col">Cases</th>
                                    <th scope="col">Passed</th>
                                    <th scope="col">Failed</th>
                                    <th scope="col">Blocked</th>
                                </tr>
                            </thead>
                            <tbody>
                                {m.byWorkItem.map((row) => (
                                    <tr key={row.key}>
                                        <th scope="row" className="item-key">
                                            {row.key}
                                        </th>
                                        <td className="num">{row.total}</td>
                                        <td className="num">{row.passed}</td>
                                        <td className="num">{row.failed}</td>
                                        <td className="num">{row.blocked}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}

            <Panel
                title="Recent plans"
                hint={`${m.plans.shared} shared · ${m.plans.reviewed} reviewed · ${m.plans.withGaps} with coverage gaps`}
            >
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th scope="col">Work item</th>
                                <th scope="col">Product</th>
                                <th scope="col">Cases</th>
                                <th scope="col">Model</th>
                                <th scope="col">Created</th>
                                <th scope="col">State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.slice(0, 8).map((plan: TestPlan) => (
                                <tr
                                    key={plan.id}
                                    onClick={() => onOpenPlan(plan.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <th scope="row" className="item-key">
                                        {plan.workItemKeys.join(', ')}
                                    </th>
                                    <td>{plan.analysis.productName}</td>
                                    <td className="num">{plan.testCases.length}</td>
                                    <td className="small muted">{plan.model.model}</td>
                                    <td className="small muted">
                                        {new Date(plan.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        {plan.shares.length > 0 && <Badge tone="passed">shared</Badge>}
                                        {(plan.report?.coverageGaps ?? []).length > 0 && (
                                            <Badge tone="blocked">gaps</Badge>
                                        )}
                                        {(plan.review ?? []).some((f) => f.severity === 'Blocker') && (
                                            <Badge tone="failed">blocker</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </>
    );
}
