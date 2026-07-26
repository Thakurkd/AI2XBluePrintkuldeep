import { useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { ViewId } from '../types';
import { Banner, EmptyState, PageHeader, Panel, Spinner } from './ui';
import TestCaseCard from './TestCaseCard';

export default function TestCasesView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { selectedStories, llm, testPlan, testCases, addTestCases } = useStore();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usePlan, setUsePlan] = useState(true);
    const [lastRun, setLastRun] = useState<string | null>(null);

    const relevant = testCases.filter((c) => selectedStories.some((s) => s.key === c.storyKey));

    async function generate() {
        setBusy(true);
        setError(null);
        try {
            const { testCases: generated, model } = await api.generateTestCases(
                selectedStories,
                llm,
                usePlan ? testPlan?.markdown : undefined
            );
            addTestCases(generated);
            setLastRun(`Generated ${generated.length} test cases with ${model}.`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Test Cases"
                subtitle="Structured, executable cases derived from each story's acceptance criteria."
                actions={
                    <>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={generate}
                            disabled={busy || !selectedStories.length}
                        >
                            {busy ? 'Generating…' : relevant.length ? 'Regenerate' : 'Generate test cases'}
                        </button>
                        {testCases.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => onNavigate('dashboard')}
                            >
                                Next: Dashboard →
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
                <Panel title="Generation options">
                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={usePlan}
                            disabled={!testPlan}
                            onChange={(e) => setUsePlan(e.target.checked)}
                        />
                        <span>
                            Align coverage with the generated test plan
                            {!testPlan && <em className="muted"> — no plan generated yet</em>}
                        </span>
                    </label>
                    <p className="muted small">
                        Regenerating replaces existing cases for the selected stories, and leaves other
                        stories' cases untouched.
                    </p>
                </Panel>
            )}

            {error && <Banner kind="error">{error}</Banner>}
            {lastRun && !error && !busy && <Banner kind="success">{lastRun}</Banner>}
            {busy && (
                <Spinner label={`Deriving test cases with ${llm.model || 'the configured model'}…`} />
            )}

            {relevant.length > 0 && !busy && (
                <Panel title={`${relevant.length} cases for the selected stories`}>
                    <div className="case-grid">
                        {relevant.map((testCase) => (
                            <TestCaseCard key={testCase.id} testCase={testCase} />
                        ))}
                    </div>
                </Panel>
            )}

            {!relevant.length && !busy && selectedStories.length > 0 && (
                <EmptyState
                    title="No test cases yet"
                    hint="Generate them from the selected stories. A test plan first gives better coverage."
                />
            )}
        </>
    );
}
