import { useState } from 'react';
import { useStore } from '../store';
import type { TestCase } from '../types';
import { Badge } from './ui';

export default function TestCaseCard({
    testCase,
    onGenerateCode,
}: {
    testCase: TestCase;
    onGenerateCode?: (testCase: TestCase) => void;
}) {
    const { generatedCode, removeTestCase } = useStore();
    const [open, setOpen] = useState(false);
    const automated = Boolean(generatedCode[testCase.id]);

    return (
        <article className={`case-card ${automated ? 'case-automated' : ''}`}>
            <div className="case-head">
                <code className="case-id">{testCase.id}</code>
                <Badge tone={automated ? 'automated' : testCase.status}>
                    {automated ? 'Automated' : testCase.status}
                </Badge>
            </div>

            <h3 className="case-title">{testCase.title}</h3>

            <div className="case-meta">
                <Badge tone={testCase.type}>{testCase.type}</Badge>
                <Badge tone={testCase.priority}>{testCase.priority}</Badge>
                <span className="muted small">{testCase.storyKey}</span>
            </div>

            {open && (
                <div className="case-detail">
                    {testCase.preconditions.length > 0 && (
                        <>
                            <h4>Preconditions</h4>
                            <ul>
                                {testCase.preconditions.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </>
                    )}

                    <h4>Steps</h4>
                    <ol className="case-steps">
                        {testCase.steps.map((step, i) => (
                            <li key={i}>{step.replace(/^\s*\d+[.)]\s*/, '')}</li>
                        ))}
                    </ol>

                    <h4>Expected result</h4>
                    <p>{testCase.expectedResult}</p>

                    {testCase.testData && (
                        <>
                            <h4>Test data</h4>
                            <pre>{testCase.testData}</pre>
                        </>
                    )}
                </div>
            )}

            <div className="case-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
                    {open ? 'Collapse' : 'Expand'}
                </button>
                {onGenerateCode && (
                    <button type="button" className="btn btn-primary" onClick={() => onGenerateCode(testCase)}>
                        {automated ? 'View code' : 'Generate code'}
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn-danger-ghost"
                    onClick={() => removeTestCase(testCase.id)}
                    title="Remove this test case"
                >
                    ✕
                </button>
            </div>
        </article>
    );
}
