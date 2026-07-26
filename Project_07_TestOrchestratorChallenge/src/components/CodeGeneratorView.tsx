import { useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { CodeLanguage, Framework } from '../types';
import { Badge, Banner, CopyButton, EmptyState, PageHeader, Panel, Spinner } from './ui';
import { codeFilename, download } from '../download';

const FRAMEWORKS: { id: Framework; label: string; languages: CodeLanguage[] }[] = [
    { id: 'playwright', label: 'Playwright', languages: ['typescript', 'javascript', 'python', 'java', 'csharp'] },
    { id: 'selenium', label: 'Selenium', languages: ['java', 'python', 'javascript', 'csharp'] },
];

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    java: 'Java',
    python: 'Python',
    csharp: 'C#',
};

export default function CodeGeneratorView() {
    const {
        testCases,
        selectedTestCase,
        setSelectedTestCase,
        stories,
        llm,
        generatedCode,
        setGeneratedCode,
    } = useStore();

    const [framework, setFramework] = useState<Framework>('playwright');
    const [language, setLanguage] = useState<CodeLanguage>('typescript');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const current = selectedTestCase ? generatedCode[selectedTestCase.id] : undefined;
    const activeFramework = FRAMEWORKS.find((f) => f.id === framework)!;

    async function generate() {
        if (!selectedTestCase) return;
        setBusy(true);
        setError(null);
        try {
            const { generated } = await api.generateCode({
                testCase: selectedTestCase,
                story: stories.find((s) => s.key === selectedTestCase.storyKey),
                framework,
                language,
                llm,
            });
            setGeneratedCode(generated);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    if (!testCases.length) {
        return (
            <>
                <PageHeader
                    title="Code Generator"
                    subtitle="Turn a test case into runnable Playwright or Selenium automation."
                />
                <EmptyState
                    title="No test cases available"
                    hint="Generate test cases first, then come back to convert one into automation code."
                />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Code Generator"
                subtitle="Turn a test case into runnable Playwright or Selenium automation."
                actions={
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={generate}
                        disabled={busy || !selectedTestCase}
                    >
                        {busy ? 'Generating…' : current ? 'Regenerate' : 'Generate code'}
                    </button>
                }
            />

            <div className="codegen-layout">
                <div className="codegen-side">
                    <Panel title="Test case">
                        <label className="field">
                            <span className="field-label">Select a case</span>
                            <select
                                value={selectedTestCase?.id ?? ''}
                                onChange={(e) => setSelectedTestCase(e.target.value || null)}
                            >
                                <option value="">— choose —</option>
                                {testCases.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.id} · {c.title}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {selectedTestCase && (
                            <div className="selected-case">
                                <div className="case-meta">
                                    <Badge tone={selectedTestCase.type}>{selectedTestCase.type}</Badge>
                                    <Badge tone={selectedTestCase.priority}>
                                        {selectedTestCase.priority}
                                    </Badge>
                                </div>
                                <h3 className="case-title">{selectedTestCase.title}</h3>
                                <h4>Steps</h4>
                                <ol className="case-steps">
                                    {selectedTestCase.steps.map((s, i) => (
                                        <li key={i}>{s.replace(/^\s*\d+[.)]\s*/, '')}</li>
                                    ))}
                                </ol>
                                <h4>Expected result</h4>
                                <p>{selectedTestCase.expectedResult}</p>
                            </div>
                        )}
                    </Panel>

                    <Panel title="Target">
                        {/* A <label> here would fold "Framework" into each button's
                            accessible name, so use a labelled radiogroup instead. */}
                        <div className="field">
                            <span className="field-label" id="framework-label">
                                Framework
                            </span>
                            <div className="segmented" role="radiogroup" aria-labelledby="framework-label">
                                {FRAMEWORKS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        role="radio"
                                        aria-checked={framework === f.id}
                                        className={framework === f.id ? 'segment segment-active' : 'segment'}
                                        onClick={() => {
                                            setFramework(f.id);
                                            if (!f.languages.includes(language)) setLanguage(f.languages[0]);
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="field">
                            <span className="field-label">Language</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
                            >
                                {activeFramework.languages.map((l) => (
                                    <option key={l} value={l}>
                                        {LANGUAGE_LABELS[l]}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </Panel>
                </div>

                <div className="codegen-main">
                    {error && <Banner kind="error">{error}</Banner>}
                    {busy && (
                        <Spinner
                            label={`Writing ${activeFramework.label} code with ${
                                llm.model || 'the configured model'
                            }…`}
                        />
                    )}

                    {!busy && current && (
                        <Panel
                            title="Compiler output"
                            actions={
                                <>
                                    <span className="muted small">
                                        {current.framework} · {LANGUAGE_LABELS[current.language]} ·{' '}
                                        {current.model}
                                    </span>
                                    <CopyButton text={current.code} />
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() =>
                                            download(
                                                codeFilename(
                                                    current.testCaseId,
                                                    current.framework,
                                                    current.language
                                                ),
                                                current.code
                                            )
                                        }
                                    >
                                        Save file
                                    </button>
                                </>
                            }
                        >
                            <pre className="code-block">
                                <code>{current.code}</code>
                            </pre>
                            <p className="muted small">
                                Selectors the test case did not pin down are emitted as TODO placeholders —
                                fill those in before running.
                            </p>
                        </Panel>
                    )}

                    {!busy && !current && (
                        <EmptyState
                            title={selectedTestCase ? 'Ready to generate' : 'No test case selected'}
                            hint={
                                selectedTestCase
                                    ? `Produces a ${activeFramework.label} page object plus a spec in ${LANGUAGE_LABELS[language]}.`
                                    : 'Pick a test case on the left, choose a framework, and generate.'
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}
