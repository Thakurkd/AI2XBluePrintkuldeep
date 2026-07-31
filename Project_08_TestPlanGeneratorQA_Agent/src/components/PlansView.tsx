import { useState } from 'react';
import { downloadJson, downloadMarkdown } from '../download';
import { useStore } from '../store';
import type { TestPlan } from '../types';
import { Badge, EmptyState, PageHeader, Panel } from './ui';

export default function PlansView({
    onOpenPlan,
    onGenerate,
}: {
    onOpenPlan: (id: string) => void;
    onGenerate: () => void;
}) {
    const { plans, deletePlan } = useStore();
    const [filter, setFilter] = useState('');

    const needle = filter.trim().toLowerCase();
    const visible = needle
        ? plans.filter((p: TestPlan) =>
              [p.workItemKeys.join(' '), p.analysis.productName, p.model.model]
                  .join(' ')
                  .toLowerCase()
                  .includes(needle)
          )
        : plans;

    return (
        <>
            <PageHeader
                title="Plans"
                subtitle="Every plan generated in this browser. Open one to read it, mark cases off, or share it back to Jira."
                actions={
                    <button type="button" className="btn btn-primary" onClick={onGenerate}>
                        New plan
                    </button>
                }
            />

            {!plans.length ? (
                <Panel>
                    <EmptyState
                        title="No plans yet"
                        hint="Generate one from a Jira key to get started."
                        action={
                            <button type="button" className="btn btn-primary" onClick={onGenerate}>
                                Generate a plan →
                            </button>
                        }
                    />
                </Panel>
            ) : (
                <Panel
                    title={`${visible.length} of ${plans.length}`}
                    actions={
                        <input
                            style={{ width: 220 }}
                            value={filter}
                            placeholder="Filter by key, product, model"
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    }
                >
                    {!visible.length ? (
                        <EmptyState title="Nothing matches that filter" hint="Try a work-item key such as SCRUM-5." />
                    ) : (
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
                                        <th scope="col" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((plan: TestPlan) => (
                                        <tr key={plan.id}>
                                            <th scope="row" className="item-key">
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-small"
                                                    onClick={() => onOpenPlan(plan.id)}
                                                >
                                                    {plan.workItemKeys.join(', ')}
                                                </button>
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
                                            </td>
                                            <td>
                                                <div className="row">
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-small"
                                                        onClick={() => downloadMarkdown(plan)}
                                                    >
                                                        .md
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-small"
                                                        onClick={() => downloadJson(plan)}
                                                    >
                                                        .json
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-small"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    `Delete the plan for ${plan.workItemKeys.join(
                                                                        ', '
                                                                    )}? This cannot be undone.`
                                                                )
                                                            ) {
                                                                deletePlan(plan.id);
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            )}
        </>
    );
}
