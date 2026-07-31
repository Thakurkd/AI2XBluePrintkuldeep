import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../api';
import { downloadCsv, downloadJson, downloadMarkdown } from '../download';
import { useStore } from '../store';
import type { TestCase, TestCaseStatus, TestPlan } from '../types';
import { TEST_CASE_STATUSES } from '../types';
import { STATUS_STYLE } from './StatusBarChart';
import { Badge, Banner, CopyButton, EmptyState, PageHeader, Panel, Spinner } from './ui';

type Tab = 'document' | 'cases' | 'analysis' | 'review' | 'report';

function CasesTable({ plan }: { plan: TestPlan }) {
    const { setCaseStatus } = useStore();

    return (
        <div className="table-scroll">
            <table className="data-table">
                <thead>
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Title</th>
                        <th scope="col">Type</th>
                        <th scope="col">Priority</th>
                        <th scope="col">Covers</th>
                        <th scope="col">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {plan.testCases.map((c: TestCase) => (
                        <tr key={c.id}>
                            <td className="item-key">{c.id}</td>
                            <td>
                                {c.title}
                                {c.gaps.length > 0 && (
                                    <div className="small muted">Needs clarification: {c.gaps.join('; ')}</div>
                                )}
                            </td>
                            <td>{c.type}</td>
                            <td>
                                <Badge tone={c.priority}>{c.priority}</Badge>
                            </td>
                            <td>{c.acceptanceCriterionRef ?? '—'}</td>
                            <td>
                                <select
                                    value={c.status}
                                    aria-label={`Status for ${c.id}`}
                                    onChange={(e) =>
                                        setCaseStatus(plan.id, c.id, e.target.value as TestCaseStatus)
                                    }
                                >
                                    {TEST_CASE_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {STATUS_STYLE[s].glyph} {STATUS_STYLE[s].label}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PlanViewer({ planId, onBack }: { planId: string; onBack: () => void }) {
    const { plans, jira, savePlan } = useStore();
    const plan = plans.find((p) => p.id === planId);

    const [tab, setTab] = useState<Tab>('document');
    const [sharing, setSharing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shared, setShared] = useState<string | null>(null);

    if (!plan) {
        return (
            <EmptyState
                title="That plan is no longer here"
                hint="It may have been deleted from this browser."
                action={
                    <button type="button" className="btn" onClick={onBack}>
                        Back to plans
                    </button>
                }
            />
        );
    }

    const blockers = (plan.review ?? []).filter((f) => f.severity === 'Blocker');
    const gaps = plan.report?.coverageGaps ?? [];

    /**
     * Nothing leaves the app without confirmation, and the dialog names the exact
     * destination — approving one target never implies another
     * (gemini.md invariant 5).
     *
     * An arrow, not a function declaration: a declaration is hoisted above the
     * "plan not found" early return, so it would not see `plan` as narrowed.
     */
    const share = async () => {
        const issueKey = plan.workItemKeys[0];
        const preview = await api.sharePreview(plan).catch(() => null);

        const confirmed = confirm(
            `Post this test plan to ${issueKey} in Jira?\n\n` +
            `• A summary comment on ${issueKey}\n` +
            `• The full plan attached as ${preview?.filename ?? 'a .md file'}\n\n` +
            (blockers.length ? `Note: the review flagged ${blockers.length} blocker(s).\n\n` : '') +
            `This writes to a ticket other people can see.`
        );
        if (!confirmed) return;

        setSharing(true);
        setError(null);
        try {
            const result = await api.shareToJira({ plan, issueKey, mode: 'both', jira });
            savePlan({
                ...plan,
                shares: [...plan.shares, ...result.shares],
                updatedAt: new Date().toISOString(),
            });
            setShared(`Posted to ${result.issueKey} and attached as ${result.filename}.`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSharing(false);
        }
    }

    return (
        <>
            <PageHeader
                title={plan.analysis.productName || plan.workItemKeys.join(', ')}
                subtitle={`${plan.workItemKeys.join(', ')} · ${plan.testCases.length} test cases · ${
                    plan.model.provider
                }/${plan.model.model} · ${new Date(plan.createdAt).toLocaleString()}`}
                actions={
                    <>
                        <button type="button" className="btn btn-ghost" onClick={onBack}>
                            Back
                        </button>
                        <button type="button" className="btn" onClick={() => downloadMarkdown(plan)}>
                            .md
                        </button>
                        <button type="button" className="btn" onClick={() => downloadJson(plan)}>
                            .json
                        </button>
                        <button type="button" className="btn" onClick={() => downloadCsv(plan)}>
                            .csv
                        </button>
                        <button type="button" className="btn btn-primary" onClick={share} disabled={sharing}>
                            {sharing ? 'Posting…' : 'Share to Jira'}
                        </button>
                    </>
                }
            />

            {error && <Banner kind="error">{error}</Banner>}
            {shared && <Banner kind="success">{shared}</Banner>}
            {sharing && (
                <Panel>
                    <Spinner label="Attaching the plan and posting the summary comment…" />
                </Panel>
            )}

            {plan.shares.length > 0 && (
                <Banner kind="info">
                    Shared {plan.shares.length} time(s). Most recent:{' '}
                    {new Date(plan.shares[plan.shares.length - 1].at).toLocaleString()} —{' '}
                    <a href={plan.shares[plan.shares.length - 1].ref} target="_blank" rel="noreferrer">
                        open in Jira ↗
                    </a>
                </Banner>
            )}

            {blockers.length > 0 && (
                <Banner kind="error">
                    The review flagged {blockers.length} blocker(s). Read the Review tab before sharing this plan.
                </Banner>
            )}

            {gaps.length > 0 && (
                <Banner kind="warn">
                    {gaps.length} coverage gap(s). These are listed in the plan's own "Open questions" section, so
                    a reader sees them too.
                </Banner>
            )}

            <div className="tabs" role="tablist">
                {(
                    [
                        ['document', 'Document'],
                        ['cases', `Test cases (${plan.testCases.length})`],
                        ['analysis', 'Analysis'],
                        ['review', `Review (${plan.review?.length ?? 0})`],
                        ['report', 'Render report'],
                    ] as [Tab, string][]
                ).map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        className="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === 'document' && (
                <Panel actions={<CopyButton text={plan.markdown} />}>
                    <div className="doc">
                        <Markdown remarkPlugins={[remarkGfm]}>{plan.markdown}</Markdown>
                    </div>
                </Panel>
            )}

            {tab === 'cases' && (
                <Panel
                    title="Test cases"
                    hint="Set a status as you execute — the dashboard counts these."
                >
                    <CasesTable plan={plan} />
                </Panel>
            )}

            {tab === 'analysis' && (
                <Panel title="Analysis" hint="The structured data the document was rendered from.">
                    <pre className="code-block">{JSON.stringify(plan.analysis, null, 2)}</pre>
                </Panel>
            )}

            {tab === 'review' && (
                <Panel title="Review findings" hint="The reviewer reports; it does not rewrite. You decide.">
                    {plan.review === undefined ? (
                        <EmptyState
                            title="This plan was not reviewed"
                            hint="Tick “Review the plan afterwards” on the Generate screen to run the check."
                        />
                    ) : plan.review.length === 0 ? (
                        <EmptyState
                            title="No findings"
                            hint="The reviewer found nothing to report, which is a valid and expected result for a sound plan."
                        />
                    ) : (
                        plan.review.map((f, i) => (
                            <div key={i} className={`finding finding-${f.severity.toLowerCase()}`}>
                                <div className="finding-head">
                                    <Badge tone={f.severity}>{f.severity}</Badge>
                                    <strong className="small">{f.section}</strong>
                                </div>
                                <p>{f.issue}</p>
                                {f.evidence && (
                                    <p className="small muted">
                                        <strong>Evidence:</strong> {f.evidence}
                                    </p>
                                )}
                                {f.fix && (
                                    <p className="small finding-fix">
                                        <strong>Fix:</strong> {f.fix}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </Panel>
            )}

            {tab === 'report' && (
                <Panel
                    title="Render report"
                    hint="What the document took from your template's defaults rather than from the ticket."
                >
                    <p className="small">
                        <strong>{plan.report.placeholders}</strong> placeholders filled.
                    </p>

                    <h3 className="small" style={{ marginTop: 14 }}>
                        Filled from template defaults ({plan.report.defaulted.length})
                    </h3>
                    {plan.report.defaulted.length ? (
                        <p className="small muted">
                            {plan.report.defaulted.join(', ')} — the work item said nothing about these, so your
                            template's standard content was used. Worth a check.
                        </p>
                    ) : (
                        <p className="small muted">None — every section came from the work item.</p>
                    )}

                    <h3 className="small" style={{ marginTop: 14 }}>
                        Rendered as “none identified” ({plan.report.empty.length})
                    </h3>
                    <p className="small muted">
                        {plan.report.empty.length ? plan.report.empty.join(', ') : 'None.'}
                    </p>

                    <h3 className="small" style={{ marginTop: 14 }}>
                        Coverage gaps ({gaps.length})
                    </h3>
                    {gaps.length ? (
                        <ul className="small">
                            {gaps.map((g, i) => (
                                <li key={i}>{g}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="small muted">
                            Every acceptance criterion has at least one test case.
                        </p>
                    )}
                </Panel>
            )}
        </>
    );
}
