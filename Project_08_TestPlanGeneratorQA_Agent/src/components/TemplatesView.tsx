import { useEffect, useState } from 'react';
import { api } from '../api';
import { BUILT_IN_TEMPLATE_ID, useStore } from '../store';
import type { Template } from '../types';
import { Badge, Banner, Field, PageHeader, Panel } from './ui';

export default function TemplatesView() {
    const { templates, activeTemplateId, setActiveTemplateId, saveTemplate, deleteTemplate } = useStore();
    const [selectedId, setSelectedId] = useState(activeTemplateId);
    const [draft, setDraft] = useState('');
    const [name, setName] = useState('');
    const [supported, setSupported] = useState<string[]>([]);
    const [status, setStatus] = useState<{ kind: 'error' | 'success' | 'warn'; text: string } | null>(null);

    const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

    useEffect(() => {
        api.placeholders()
            .then((r) => setSupported(r.placeholders))
            .catch(() => setSupported([]));
    }, []);

    useEffect(() => {
        if (selected) {
            setDraft(selected.body);
            setName(selected.name);
            setStatus(null);
        }
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const used = [...new Set([...draft.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))];
    const unknown = supported.length ? used.filter((p) => !supported.includes(p)) : [];

    /**
     * Validation happens at save time, not generation time: an unknown placeholder
     * should be a save-time error rather than a surprise half an hour later
     * (architecture/05_ui_spec.md).
     */
    async function save() {
        const check = await api.validateTemplate(draft).catch(() => null);
        if (check && !check.ok) {
            setStatus({
                kind: 'error',
                text: `Cannot save: ${check.unknown.join(', ')} ${
                    check.unknown.length === 1 ? 'is not a placeholder' : 'are not placeholders'
                } the renderer can fill. Remove them, or use one from the list below.`,
            });
            return;
        }

        // The built-in template is a copy of your company document; edits become a
        // new template rather than overwriting the reference.
        const isBuiltIn = selected?.id === BUILT_IN_TEMPLATE_ID;
        const template: Template = {
            id: isBuiltIn ? `custom_${Date.now().toString(36)}` : selected!.id,
            name: isBuiltIn ? `${name} (edited)` : name,
            body: draft,
            builtIn: false,
            updatedAt: new Date().toISOString(),
        };

        saveTemplate(template);
        setSelectedId(template.id);
        setStatus({
            kind: 'success',
            text: isBuiltIn
                ? `Saved as a new template, "${template.name}". The built-in reference is unchanged.`
                : 'Saved.',
        });
    }

    return (
        <>
            <PageHeader
                title="Templates"
                subtitle="The document the agent fills. Section order and boilerplate are yours; the agent only supplies the marked slots."
            />

            {status && <Banner kind={status.kind}>{status.text}</Banner>}

            <Panel title="Templates">
                <div className="stack">
                    {templates.map((t) => (
                        <div key={t.id} className="row">
                            <button
                                type="button"
                                className={t.id === selectedId ? 'btn btn-primary btn-small' : 'btn btn-small'}
                                onClick={() => setSelectedId(t.id)}
                            >
                                {t.name}
                            </button>
                            {t.builtIn && <Badge>built in</Badge>}
                            {t.id === activeTemplateId && <Badge tone="passed">in use</Badge>}
                            {t.id !== activeTemplateId && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-small"
                                    onClick={() => setActiveTemplateId(t.id)}
                                >
                                    Use this
                                </button>
                            )}
                            {!t.builtIn && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-small"
                                    onClick={() => {
                                        if (confirm(`Delete the template "${t.name}"?`)) deleteTemplate(t.id);
                                    }}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Panel>

            {selected && (
                <Panel
                    title="Editor"
                    hint={`${used.length} placeholder(s) used${
                        unknown.length ? ` · ${unknown.length} unrecognised` : ''
                    }`}
                    actions={
                        <button type="button" className="btn btn-primary" onClick={save}>
                            Save
                        </button>
                    }
                >
                    {unknown.length > 0 && (
                        <Banner kind="warn">
                            Not recognised: {unknown.join(', ')}. Saving will be refused until these are removed —
                            the renderer has nothing to put in them.
                        </Banner>
                    )}

                    <Field label="Name">
                        <input value={name} onChange={(e) => setName(e.target.value)} />
                    </Field>

                    <Field
                        label="Body"
                        hint="Markdown with {{PLACEHOLDER}} slots. Headings and standard prose are left exactly as written."
                    >
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            style={{ minHeight: 420, fontFamily: 'var(--mono)', fontSize: 12 }}
                        />
                    </Field>
                </Panel>
            )}

            <Panel
                title="Available placeholders"
                hint="Everything the renderer can supply. Anything else is a save-time error."
            >
                <div className="row">
                    {supported.map((p) => (
                        <code key={p} style={{ fontSize: 11 }}>{`{{${p}}}`}</code>
                    ))}
                </div>
            </Panel>
        </>
    );
}
