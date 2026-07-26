import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../api';
import { useStore } from '../store';
import type { ViewId } from '../types';
import { Banner, CopyButton, EmptyState, PageHeader, Panel, Spinner } from './ui';
import { download } from '../download';

export default function TestPlanView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { selectedStories, llm, testPlan, setTestPlan } = useStore();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function generate() {
        setBusy(true);
        setError(null);
        try {
            const { testPlan: plan } = await api.generateTestPlan(selectedStories, llm);
            setTestPlan(plan);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Test Plan"
                subtitle="Scope, approach, risks, and open questions — derived from the selected stories."
                actions={
                    <>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={generate}
                            disabled={busy || !selectedStories.length}
                        >
                            {busy ? 'Generating…' : testPlan ? 'Regenerate' : 'Generate test plan'}
                        </button>
                        {testPlan && (
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => onNavigate('testCases')}
                            >
                                Next: Test Cases →
                            </button>
                        )}
                    </>
                }
            />

            {!selectedStories.length && (
                <Banner kind="info">
                    No stories selected. Go to <strong>User Stories</strong> and pick at least one.
                </Banner>
            )}

            {selectedStories.length > 0 && (
                <Panel title={`Context: ${selectedStories.length} stories`}>
                    <div className="chip-row">
                        {selectedStories.map((s) => (
                            <span key={s.key} className="chip" title={s.summary}>
                                <code>{s.key}</code> {s.summary}
                            </span>
                        ))}
                    </div>
                </Panel>
            )}

            {error && <Banner kind="error">{error}</Banner>}
            {busy && <Spinner label={`Writing the plan with ${llm.model}…`} />}

            {testPlan && !busy && (
                <Panel
                    title="Generated plan"
                    actions={
                        <>
                            <span className="muted small">
                                {testPlan.model} · {new Date(testPlan.generatedAt).toLocaleString()}
                            </span>
                            <CopyButton text={testPlan.markdown} />
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => download('test-plan.md', testPlan.markdown)}
                            >
                                Save .md
                            </button>
                        </>
                    }
                >
                    <article className="markdown">
                        <Markdown remarkPlugins={[remarkGfm]}>{testPlan.markdown}</Markdown>
                    </article>
                </Panel>
            )}

            {!testPlan && !busy && selectedStories.length > 0 && (
                <EmptyState
                    title="No plan yet"
                    hint="Generate one from the selected stories, then move on to test cases."
                />
            )}
        </>
    );
}
