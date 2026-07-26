import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { TestCase, ViewId } from '../types';
import { EmptyState, PageHeader, Panel } from './ui';
import TestCaseCard from './TestCaseCard';
import { download } from '../download';

const ALL = '__all__';

export default function DashboardView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { testCases, generatedCode, setSelectedTestCase, clearTestCases } = useStore();
    const [storyFilter, setStoryFilter] = useState(ALL);
    const [typeFilter, setTypeFilter] = useState(ALL);
    const [query, setQuery] = useState('');

    const storyKeys = useMemo(
        () => [...new Set(testCases.map((c) => c.storyKey))].sort(),
        [testCases]
    );
    const types = useMemo(() => [...new Set(testCases.map((c) => c.type))].sort(), [testCases]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return testCases.filter((c) => {
            if (storyFilter !== ALL && c.storyKey !== storyFilter) return false;
            if (typeFilter !== ALL && c.type !== typeFilter) return false;
            if (!needle) return true;
            return `${c.id} ${c.title} ${c.expectedResult}`.toLowerCase().includes(needle);
        });
    }, [testCases, storyFilter, typeFilter, query]);

    const automatedCount = testCases.filter((c) => generatedCode[c.id]).length;

    function openInCodeGenerator(testCase: TestCase) {
        setSelectedTestCase(testCase.id);
        onNavigate('codeGenerator');
    }

    if (!testCases.length) {
        return (
            <>
                <PageHeader title="Dashboard" subtitle="Every generated test case in one place." />
                <EmptyState
                    title="Nothing to show yet"
                    hint="Generate test cases first — they all collect here, ready to turn into automation code."
                />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Every generated test case in one place. Pick one to turn into automation code."
                actions={
                    <>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() =>
                                download(
                                    'test-cases.json',
                                    JSON.stringify(testCases, null, 2),
                                    'application/json'
                                )
                            }
                        >
                            Export JSON
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger-ghost"
                            onClick={() => {
                                if (confirm('Delete all test cases and generated code?')) clearTestCases();
                            }}
                        >
                            Clear all
                        </button>
                    </>
                }
            />

            <div className="stat-row">
                <div className="stat">
                    <span className="stat-value">{testCases.length}</span>
                    <span className="stat-label">Total cases</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{storyKeys.length}</span>
                    <span className="stat-label">Stories covered</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{automatedCount}</span>
                    <span className="stat-label">Automated</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{testCases.length - automatedCount}</span>
                    <span className="stat-label">Awaiting code</span>
                </div>
            </div>

            <Panel title={`${filtered.length} of ${testCases.length} shown`}>
                <div className="form-row">
                    <label className="field field-inline">
                        <span className="field-label">Story</span>
                        <select value={storyFilter} onChange={(e) => setStoryFilter(e.target.value)}>
                            <option value={ALL}>All stories</option>
                            {storyKeys.map((k) => (
                                <option key={k} value={k}>
                                    {k}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field field-inline">
                        <span className="field-label">Type</span>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                            <option value={ALL}>All types</option>
                            {types.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field field-inline field-grow">
                        <span className="field-label">Search</span>
                        <input
                            value={query}
                            placeholder="Filter by id, title, or expected result"
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>
                </div>

                {filtered.length === 0 ? (
                    <EmptyState title="No matches" hint="Loosen the filters to see more test cases." />
                ) : (
                    <div className="case-grid">
                        {filtered.map((testCase) => (
                            <TestCaseCard
                                key={testCase.id}
                                testCase={testCase}
                                onGenerateCode={openInCodeGenerator}
                            />
                        ))}
                    </div>
                )}
            </Panel>
        </>
    );
}
