import { useCallback, useEffect, useState } from 'react';
import { api, type ModelList, type ModelTest } from '../api';
import { useStore } from '../store';
import type { LLMProvider, ServerConfig } from '../types';
import { Badge, Banner, Field, PageHeader, Panel } from './ui';

const LABELS: Record<LLMProvider, string> = {
    groq: 'Groq Cloud',
    // Named explicitly: Groq and Grok are different products, and confusing them
    // is an easy mistake to make (findings.md §8).
    xai: 'Grok (xAI)',
    openai: 'OpenAI',
    claude: 'Claude',
    gemini: 'Gemini',
    ollama: 'Ollama (local)',
};

export default function SettingsView() {
    const { llm, setLLM, meta, setMeta, verified, markVerified, reset } = useStore();
    const [server, setServer] = useState<ServerConfig | null>(null);
    const [models, setModels] = useState<ModelList | null>(null);
    const [result, setResult] = useState<ModelTest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        api.serverConfig().then(setServer).catch((e: Error) => setError(e.message));
    }, []);

    const loadModels = useCallback(async (provider: LLMProvider) => {
        setLoadingModels(true);
        setModels(null);
        try {
            setModels(await api.models(provider));
        } catch {
            // A failed list must never block the user: the field stays free text.
            setModels({ provider, models: [], excluded: [], live: false, localOnly: false });
        } finally {
            setLoadingModels(false);
        }
    }, []);

    useEffect(() => {
        loadModels(llm.provider);
    }, [llm.provider, loadModels]);

    async function test() {
        setBusy(true);
        setError(null);
        setResult(null);
        try {
            const r = await api.testModel(llm);
            setResult(r);
            markVerified('llm', `${r.provider} / ${r.model}`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    const providers = server?.llm.providers ?? (Object.keys(LABELS) as LLMProvider[]);

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="The model that writes the analysis and the test cases, plus the document details stamped into every plan."
            />

            {error && <Banner kind="error">{error}</Banner>}

            {result && (
                <Banner kind={result.warning ? 'warn' : 'success'}>
                    {result.provider} / {result.model} answered in {(result.latencyMs / 1000).toFixed(2)}s.{' '}
                    {result.jsonMode
                        ? 'JSON mode honoured.'
                        : 'It ignored JSON mode — output will be recovered by the tolerant parser, which is less reliable.'}
                    {result.warning && (
                        <>
                            <br />
                            <br />
                            {result.warning}
                        </>
                    )}
                </Banner>
            )}

            <Panel
                title="Test model"
                hint="Blank fields follow the server's .env, so the common case is: pick a model and go."
                actions={
                    <button type="button" className="btn btn-primary" onClick={test} disabled={busy}>
                        {busy ? 'Testing…' : 'Test connection'}
                    </button>
                }
            >
                <div className="row" style={{ marginBottom: 16 }}>
                    <Badge tone={verified.llm ? 'passed' : 'neutral'}>
                        {verified.llm ? '✓ verified' : '○ not verified'}
                    </Badge>
                    {verified.llm && (
                        <span className="small muted">
                            {verified.llm.as} · {new Date(verified.llm.at).toLocaleString()}
                        </span>
                    )}
                </div>

                <div className="form-grid">
                    <Field label="Provider">
                        <select
                            value={llm.provider}
                            onChange={(e) => {
                                // Clear the model rather than pinning this provider's
                                // first one — blank lets the server pick a sane default.
                                setLLM({ ...llm, provider: e.target.value as LLMProvider, model: '' });
                                setResult(null);
                            }}
                        >
                            {providers.map((p) => (
                                <option key={p} value={p}>
                                    {LABELS[p] ?? p}
                                    {server && !server.llm.configured[p] ? ' — no key on server' : ''}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field
                        label="Model"
                        hint={
                            loadingModels
                                ? 'Reading the provider’s model list…'
                                : models?.live
                                  ? `${models.models.length} chat model(s) available. Free text is allowed.`
                                  : (models?.note ?? 'Type a model id.')
                        }
                    >
                        <input
                            list="model-options"
                            value={llm.model}
                            placeholder={server?.llm.model || 'server default'}
                            onChange={(e) => setLLM({ ...llm, model: e.target.value })}
                        />
                        <datalist id="model-options">
                            {(models?.models ?? []).map((m) => (
                                <option key={m} value={m} />
                            ))}
                        </datalist>
                    </Field>

                    <Field label="API key" hint="Leave blank to use the server's key for this provider.">
                        <input
                            type="password"
                            value={llm.apiKey}
                            placeholder={
                                llm.provider === 'ollama'
                                    ? 'Not needed for Ollama'
                                    : server?.llm.configured[llm.provider]
                                      ? '•••••• (using server key)'
                                      : 'No server key for this provider'
                            }
                            onChange={(e) => setLLM({ ...llm, apiKey: e.target.value })}
                        />
                    </Field>
                </div>

                {models && models.excluded.length > 0 && (
                    <p className="small muted" style={{ marginTop: 12 }}>
                        {models.excluded.length} model(s) this provider offers were left out of the list because
                        they cannot answer a chat request ({models.excluded.slice(0, 3).join(', ')}
                        {models.excluded.length > 3 ? ', …' : ''}).
                    </p>
                )}

                {server?.llm.localOnly.includes(llm.provider) && (
                    <Banner kind="info">
                        Ollama runs on your machine, so it works locally but not on the deployed app — a local
                        model is far slower than a hosted one and a full plan will exceed the serverless request
                        limit. Measured on this project: 24s for a trivial request against Groq’s 1s.
                    </Banner>
                )}
            </Panel>

            <Panel title="Document details" hint="Stamped into every plan this browser generates.">
                <div className="form-grid">
                    <Field label="Author">
                        <input
                            value={meta.author}
                            placeholder="Your name"
                            onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                        />
                    </Field>
                    <Field label="Version">
                        <input value={meta.version} onChange={(e) => setMeta({ ...meta, version: e.target.value })} />
                    </Field>
                    <Field label="Environment">
                        <input
                            value={meta.environment}
                            placeholder="QA / Staging"
                            onChange={(e) => setMeta({ ...meta, environment: e.target.value })}
                        />
                    </Field>
                    <Field label="Browser">
                        <input
                            value={meta.browser}
                            placeholder="Chrome"
                            onChange={(e) => setMeta({ ...meta, browser: e.target.value })}
                        />
                    </Field>
                    <Field label="Application URL" hint="Used when the work item does not name one.">
                        <input
                            value={meta.baseUrl}
                            placeholder="https://staging.example.com"
                            onChange={(e) => setMeta({ ...meta, baseUrl: e.target.value })}
                        />
                    </Field>
                </div>
            </Panel>

            <Panel title="Workspace">
                <p className="muted">
                    Plans, templates, and settings are kept in this browser's local storage. They are private to
                    this browser and are not shared with anyone else who opens the app.
                </p>
                <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                        if (confirm('Delete every plan, template, and setting in this browser?')) reset();
                    }}
                >
                    Clear workspace
                </button>
            </Panel>
        </>
    );
}
