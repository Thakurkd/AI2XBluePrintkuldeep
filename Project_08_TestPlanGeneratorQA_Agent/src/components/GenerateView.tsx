/**
 * The main flow: an id in, a plan out.
 *
 * The pipeline is driven from the client, one step per request, because three
 * chained model calls in a single request exceed the serverless 60s ceiling
 * (findings.md §4). The side benefit is that a failure part-way through does not
 * throw away the work already done — "retry from here" resumes at the failed step.
 */
import { useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { PlanAnalysis, ReviewFinding, TestCase, TestPlan, WorkItem, WorkItemLink } from '../types';
import { Badge, Banner, Field, PageHeader, Panel, Spinner } from './ui';

type StepId = 'analyze' | 'cases' | 'render' | 'review';
type StepState = 'idle' | 'running' | 'done' | 'failed';

const STEP_LABELS: Record<StepId, string> = {
    analyze: 'Analysing requirements',
    cases: 'Deriving test cases',
    render: 'Rendering the document',
    review: 'Reviewing the plan',
};

const MARK: Record<StepState, string> = { idle: '○', running: '◐', done: '✓', failed: '✕' };

function newId(): string {
    return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function GenerateView({ onOpenPlan }: { onOpenPlan: (id: string) => void }) {
    const { jira, llm, meta, activeTemplate, templates, activeTemplateId, setActiveTemplateId, savePlan } =
        useStore();

    const [input, setInput] = useState('');
    const [items, setItems] = useState<WorkItem[]>([]);
    const [available, setAvailable] = useState<WorkItemLink[]>([]);
    const [include, setInclude] = useState<string[]>([]);
    const [context, setContext] = useState('');
    const [withReview, setWithReview] = useState(false);

    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /**
     * Kept separate from `error` so it can be shown next to the step that failed.
     * A red cross at the bottom of the page with the reason in a banner scrolled
     * off the top tells the user nothing.
     */
    const [pipelineError, setPipelineError] = useState<string | null>(null);
    const [steps, setSteps] = useState<Record<StepId, StepState>>({
        analyze: 'idle',
        cases: 'idle',
        render: 'idle',
        review: 'idle',
    });
    const [running, setRunning] = useState(false);

    // Kept across attempts so a failure mid-pipeline resumes instead of restarting.
    const [analysis, setAnalysis] = useState<PlanAnalysis | null>(null);
    const [testCases, setTestCases] = useState<TestCase[] | null>(null);

    const busy = fetching || running;

    async function fetchItems(includeKeys = include) {
        if (!input.trim()) return;
        setFetching(true);
        setError(null);
        try {
            const result = await api.fetchWorkItems(jira, input.trim(), includeKeys);
            setItems(result.items);
            setAvailable(result.available);
            // A new fetch invalidates everything downstream.
            setAnalysis(null);
            setTestCases(null);
            setSteps({ analyze: 'idle', cases: 'idle', render: 'idle', review: 'idle' });
        } catch (e) {
            setError((e as Error).message);
            setItems([]);
            setAvailable([]);
        } finally {
            setFetching(false);
        }
    }

    function toggleLinked(key: string) {
        const next = include.includes(key) ? include.filter((k) => k !== key) : [...include, key];
        setInclude(next);
        fetchItems(next);
    }

    async function generate() {
        if (!items.length) return;
        setRunning(true);
        setPipelineError(null);

        const mark = (id: StepId, state: StepState) => setSteps((s) => ({ ...s, [id]: state }));

        try {
            let workingAnalysis = analysis;
            if (!workingAnalysis) {
                mark('analyze', 'running');
                try {
                    const r = await api.analyze({ workItems: items, additionalContext: context, llm });
                    workingAnalysis = r.analysis;
                    setAnalysis(r.analysis);
                    mark('analyze', 'done');
                } catch (e) {
                    mark('analyze', 'failed');
                    throw e;
                }
            } else {
                mark('analyze', 'done');
            }

            let workingCases = testCases;
            if (!workingCases) {
                mark('cases', 'running');
                try {
                    const r = await api.cases({
                        workItems: items,
                        analysis: workingAnalysis,
                        additionalContext: context,
                        llm,
                    });
                    workingCases = r.testCases;
                    setTestCases(r.testCases);
                    mark('cases', 'done');
                } catch (e) {
                    mark('cases', 'failed');
                    throw e;
                }
            } else {
                mark('cases', 'done');
            }

            mark('render', 'running');
            let markdown: string;
            let report;
            try {
                const r = await api.render({
                    template: activeTemplate.body,
                    workItems: items,
                    analysis: workingAnalysis,
                    testCases: workingCases,
                    meta,
                    additionalContext: context,
                    generatedBy: `${llm.provider}/${llm.model || 'server default'}`,
                });
                markdown = r.markdown;
                report = r.report;
                mark('render', 'done');
            } catch (e) {
                mark('render', 'failed');
                throw e;
            }

            let review: ReviewFinding[] | undefined;
            if (withReview) {
                mark('review', 'running');
                try {
                    const r = await api.review({ markdown, workItems: items, testCases: workingCases, llm });
                    review = r.findings;
                    mark('review', 'done');
                } catch (e) {
                    // A failed review must not lose a good plan — the document is
                    // already rendered and worth keeping.
                    mark('review', 'failed');
                    setPipelineError(
                        `The plan was generated and saved. Only the review step failed: ${(e as Error).message}`
                    );
                }
            }

            const now = new Date().toISOString();
            const plan: TestPlan = {
                id: newId(),
                workItemKeys: items.map((i) => i.key),
                templateId: activeTemplate.id,
                fidelity: 'strict',
                meta,
                additionalContext: context,
                workItems: items,
                analysis: workingAnalysis,
                testCases: workingCases,
                markdown,
                report,
                review,
                model: { provider: llm.provider, model: llm.model || 'server default' },
                createdAt: now,
                updatedAt: now,
                shares: [],
            };

            savePlan(plan);
            onOpenPlan(plan.id);
        } catch (e) {
            setPipelineError((e as Error).message);
        } finally {
            setRunning(false);
        }
    }

    const anyProgress = Object.values(steps).some((s) => s !== 'idle');
    const failedStep = (Object.entries(steps) as [StepId, StepState][]).find(([, s]) => s === 'failed');

    return (
        <>
            <PageHeader
                title="Generate a test plan"
                subtitle="Paste a Jira key. The agent reads the work item, extracts what a plan needs, derives test cases, and fills your template."
            />

            {error && <Banner kind="error">{error}</Banner>}

            <Panel title="1 · Source" hint="An issue key, a browse URL, several keys, or a project key.">
                <div className="row">
                    <input
                        style={{ maxWidth: 320 }}
                        value={input}
                        placeholder={jira.projectKey ? `${jira.projectKey}-1` : 'SCRUM-5'}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') fetchItems();
                        }}
                    />
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => fetchItems()}
                        disabled={busy || !input.trim()}
                    >
                        {fetching ? 'Fetching…' : 'Fetch'}
                    </button>
                </div>
            </Panel>

            {fetching && (
                <Panel>
                    <Spinner label={`Fetching ${input.trim()} from Jira…`} />
                </Panel>
            )}

            {items.length > 0 && (
                <Panel title="2 · Work item" hint={`${items.length} item(s) in scope for this plan.`}>
                    <div className="stack">
                        {items.map((item) => (
                            <article key={item.key} className="item-card">
                                <div className="item-head">
                                    <span className="item-key">{item.key}</span>
                                    <span className="item-title">{item.title}</span>
                                    <a href={item.url} target="_blank" rel="noreferrer" className="small">
                                        open in Jira ↗
                                    </a>
                                </div>

                                <div className="item-meta">
                                    <Badge>{item.type}</Badge>
                                    <Badge>{item.status}</Badge>
                                    <Badge tone={item.priority}>{item.priority} priority</Badge>
                                    {item.assignee && <Badge>{item.assignee}</Badge>}
                                    {item.labels.map((l) => (
                                        <Badge key={l}>{l}</Badge>
                                    ))}
                                </div>

                                {item.description ? (
                                    <div className="item-desc">{item.description}</div>
                                ) : (
                                    <p className="small muted">
                                        This item has no description. A plan can still be generated, but it will
                                        rest entirely on the summary — expect open questions.
                                    </p>
                                )}

                                <div>
                                    <strong className="small">
                                        Acceptance criteria ({item.acceptanceCriteria.length})
                                    </strong>{' '}
                                    <span className="small muted">
                                        {item.criteriaSource === 'field'
                                            ? 'from a Jira field'
                                            : item.criteriaSource === 'description'
                                              ? 'read from the description'
                                              : ''}
                                    </span>

                                    {item.acceptanceCriteria.length ? (
                                        <ol className="criteria-list small">
                                            {item.acceptanceCriteria.map((c, i) => (
                                                <li key={i}>{c}</li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <Banner kind="warn">
                                            No acceptance criteria found in {item.key}. Coverage will be derived
                                            from the description alone, and the plan will say so.
                                        </Banner>
                                    )}
                                </div>
                            </article>
                        ))}

                        {available.length > 0 && (
                            <div>
                                <strong className="small">Linked items</strong>
                                <p className="small muted" style={{ margin: '2px 0 8px' }}>
                                    Not included unless you tick them — the agent does not decide your scope.
                                </p>
                                {available.map((link) => (
                                    <label key={link.key} className="row small" style={{ marginBottom: 4 }}>
                                        <input
                                            type="checkbox"
                                            style={{ width: 'auto' }}
                                            checked={include.includes(link.key)}
                                            onChange={() => toggleLinked(link.key)}
                                            disabled={busy}
                                        />
                                        <span className="item-key">{link.key}</span>
                                        <Badge>{link.type}</Badge>
                                        <span className="muted">{link.title}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </Panel>
            )}

            {items.length > 0 && (
                <>
                    <Panel
                        title="3 · Additional context"
                        hint="Optional. Passed to the model word for word, never summarised away."
                    >
                        <textarea
                            value={context}
                            placeholder="What the ticket does not say — an environment quirk, a regression to protect, a design note, a rule everyone knows but nobody wrote down."
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </Panel>

                    <Panel title="4 · Document">
                        <div className="form-grid">
                            <Field label="Template" hint={`${activeTemplate.builtIn ? 'Built in' : 'Custom'}.`}>
                                <select
                                    value={activeTemplateId}
                                    onChange={(e) => setActiveTemplateId(e.target.value)}
                                >
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Fidelity"
                                hint="Strict keeps your boilerplate byte-identical. Enriched is specified but not built."
                            >
                                <select value="strict" disabled>
                                    <option value="strict">Strict — fill slots only</option>
                                </select>
                            </Field>
                        </div>

                        <label className="row small" style={{ marginTop: 14 }}>
                            <input
                                type="checkbox"
                                style={{ width: 'auto' }}
                                checked={withReview}
                                onChange={(e) => setWithReview(e.target.checked)}
                            />
                            <span>
                                Review the plan afterwards — a second pass that looks for unsupported claims and
                                coverage gaps. One extra model call.
                            </span>
                        </label>
                    </Panel>

                    <Panel
                        title="5 · Generate"
                        actions={
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={generate}
                                disabled={busy}
                            >
                                {running
                                    ? 'Working…'
                                    : failedStep
                                      ? `Retry from ${STEP_LABELS[failedStep[0]].toLowerCase()}`
                                      : 'Generate plan'}
                            </button>
                        }
                    >
                        {anyProgress ? (
                            <>
                                <div className="steps">
                                    {(Object.keys(STEP_LABELS) as StepId[])
                                        .filter((id) => id !== 'review' || withReview)
                                        .map((id) => (
                                            <div key={id} className={`step step-${steps[id]}`}>
                                                <span className="step-mark" aria-hidden="true">
                                                    {MARK[steps[id]]}
                                                </span>
                                                <span>{STEP_LABELS[id]}</span>
                                                {steps[id] === 'running' && <span className="spinner" />}
                                            </div>
                                        ))}
                                </div>

                                {/* The reason sits with the step that failed, not in a
                                    banner the user has scrolled past. */}
                                {pipelineError && (
                                    <div style={{ marginTop: 14 }}>
                                        <Banner kind="error">{pipelineError}</Banner>
                                        {failedStep && failedStep[0] !== 'analyze' && (
                                            <p className="small muted" style={{ margin: 0 }}>
                                                The steps before this one are kept — retrying resumes here rather
                                                than starting again.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="muted small">
                                Four steps: analyse, derive cases, render, and optionally review. Each runs as its
                                own request, so a rate limit part-way through does not lose the work before it.
                            </p>
                        )}
                    </Panel>
                </>
            )}
        </>
    );
}
