import { useEffect, useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { ServerConfig } from '../types';
import { Banner, Field, PageHeader, Panel, Spinner } from './ui';

const PROVIDERS = [
    { id: 'groq', label: 'Groq', models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'] },
    { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini'] },
    { id: 'claude', label: 'Claude', models: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5-20251001'] },
    { id: 'gemini', label: 'Gemini', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
    { id: 'ollama', label: 'Ollama (local)', models: ['llama3.2:3b'] },
];

export default function SettingsView() {
    const { jira, setJira, llm, setLLM, reset } = useStore();
    const [server, setServer] = useState<ServerConfig | null>(null);
    const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        api.serverConfig().then(setServer).catch((e: Error) => setLoadError(e.message));
    }, []);

    const provider = PROVIDERS.find((p) => p.id === llm.provider) ?? PROVIDERS[0];

    async function testJira() {
        setBusy(true);
        setStatus(null);
        try {
            const result = await api.verifyJira(jira);
            setStatus({
                kind: 'success',
                text: `Connected to ${result.baseUrl} as ${result.displayName} (${result.email}).`,
            });
        } catch (error) {
            setStatus({ kind: 'error', text: (error as Error).message });
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Credentials live in the server's .env. Anything you type here overrides them for this browser only."
            />

            {loadError && <Banner kind="error">Cannot reach the backend: {loadError}</Banner>}

            <Panel title="Server configuration">
                {!server && !loadError && <Spinner label="Reading server config…" />}
                {server && (
                    <div className="config-grid">
                        <div>
                            <span className="config-key">Jira site</span>
                            <span className="config-value">{server.jira.baseUrl || <em>not set</em>}</span>
                        </div>
                        <div>
                            <span className="config-key">Jira account</span>
                            <span className="config-value">{server.jira.email || <em>not set</em>}</span>
                        </div>
                        <div>
                            <span className="config-key">Jira token</span>
                            <span className="config-value">
                                {server.jira.hasToken ? '✓ present' : <em>missing</em>}
                            </span>
                        </div>
                        <div>
                            <span className="config-key">Default project</span>
                            <span className="config-value">{server.jira.projectKey || <em>not set</em>}</span>
                        </div>
                        <div>
                            <span className="config-key">LLM keys on server</span>
                            <span className="config-value">
                                {Object.entries(server.llm.configured)
                                    .filter(([, present]) => present)
                                    .map(([name]) => name)
                                    .join(', ') || <em>none</em>}
                            </span>
                        </div>
                    </div>
                )}
            </Panel>

            <Panel
                title="Jira"
                actions={
                    <button type="button" className="btn btn-primary" onClick={testJira} disabled={busy}>
                        {busy ? 'Testing…' : 'Test connection'}
                    </button>
                }
            >
                {status && <Banner kind={status.kind}>{status.text}</Banner>}

                <div className="form-grid">
                    <Field label="Site URL" hint="Leave blank to use the server value.">
                        <input
                            value={jira.baseUrl}
                            placeholder={server?.jira.baseUrl || 'https://your-site.atlassian.net'}
                            onChange={(e) => setJira({ ...jira, baseUrl: e.target.value })}
                        />
                    </Field>
                    <Field label="Email" hint="Leave blank to use the server value.">
                        <input
                            value={jira.email}
                            placeholder={server?.jira.email || 'you@company.com'}
                            onChange={(e) => setJira({ ...jira, email: e.target.value })}
                        />
                    </Field>
                    <Field label="API token" hint="Only needed to override the server's token.">
                        <input
                            type="password"
                            value={jira.apiToken}
                            placeholder={server?.jira.hasToken ? '•••••• (using server token)' : 'Required'}
                            onChange={(e) => setJira({ ...jira, apiToken: e.target.value })}
                        />
                    </Field>
                    <Field label="Default project key" hint="e.g. SCRUM. Used when no JQL is given.">
                        <input
                            value={jira.projectKey}
                            placeholder={server?.jira.projectKey || 'SCRUM'}
                            onChange={(e) => setJira({ ...jira, projectKey: e.target.value })}
                        />
                    </Field>
                </div>
            </Panel>

            <Panel title="Language model">
                <div className="form-grid">
                    <Field label="Provider">
                        <select
                            value={llm.provider}
                            onChange={(e) => {
                                // Clear the model rather than pinning this provider's first
                                // one — blank lets the server pick a sane default.
                                setLLM({ ...llm, provider: e.target.value, model: '' });
                            }}
                        >
                            {PROVIDERS.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field
                        label="Model"
                        hint={
                            llm.model
                                ? 'Overrides the server. Clear the field to follow the server again.'
                                : `Using the server's model. Type one to override it.`
                        }
                    >
                        <input
                            list="model-options"
                            value={llm.model}
                            placeholder={server?.llm.model || 'server default'}
                            onChange={(e) => setLLM({ ...llm, model: e.target.value })}
                        />
                        <datalist id="model-options">
                            {provider.models.map((m) => (
                                <option key={m} value={m} />
                            ))}
                        </datalist>
                    </Field>
                    <Field label="API key" hint="Leave blank to use the server's key for this provider.">
                        <input
                            type="password"
                            value={llm.apiKey}
                            placeholder={
                                server?.llm.configured[llm.provider]
                                    ? '•••••• (using server key)'
                                    : llm.provider === 'ollama'
                                      ? 'Not needed for Ollama'
                                      : 'No server key for this provider'
                            }
                            onChange={(e) => setLLM({ ...llm, apiKey: e.target.value })}
                        />
                    </Field>
                </div>
            </Panel>

            <Panel title="Workspace">
                <p className="muted">
                    Stories, plans, test cases, and generated code are kept in this browser's local storage.
                </p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        if (confirm('Clear all stories, plans, test cases, and generated code?')) reset();
                    }}
                >
                    Clear workspace
                </button>
            </Panel>
        </>
    );
}
