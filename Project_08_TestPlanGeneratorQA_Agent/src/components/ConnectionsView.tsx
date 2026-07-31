import { useEffect, useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { JiraIdentity, ServerConfig } from '../types';
import { Badge, Banner, Field, PageHeader, Panel, Spinner } from './ui';

export default function ConnectionsView() {
    const { jira, setJira, verified, markVerified } = useStore();
    const [server, setServer] = useState<ServerConfig | null>(null);
    const [identity, setIdentity] = useState<JiraIdentity | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.serverConfig().then(setServer).catch((e: Error) => setError(e.message));
    }, []);

    async function test() {
        setBusy(true);
        setError(null);
        setIdentity(null);
        try {
            const result = await api.testConnection(jira);
            setIdentity(result);
            markVerified('jira', `${result.displayName} (${result.email})`);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Connections"
                subtitle="Where work items come from. Credentials live in the server's .env — anything typed here overrides them for this browser only, and never reaches another user."
            />

            {error && <Banner kind="error">{error}</Banner>}

            {identity && (
                <Banner kind="success">
                    Connected to <strong>{identity.baseUrl}</strong> as <strong>{identity.displayName}</strong> (
                    {identity.email}).{' '}
                    {identity.projects.length
                        ? `${identity.projects.length} project(s) visible: ${identity.projects
                              .map((p) => p.key)
                              .join(', ')}.`
                        : 'No projects are visible to this account — the token is valid but may point at the wrong site.'}
                </Banner>
            )}

            <Panel
                title="Jira Cloud"
                hint="The only connector in this version. Azure DevOps and X-Ray have written specifications and no implementation yet."
                actions={
                    <button type="button" className="btn btn-primary" onClick={test} disabled={busy}>
                        {busy ? 'Testing…' : 'Test connection'}
                    </button>
                }
            >
                {!server && !error && <Spinner label="Reading server configuration…" />}

                {server && (
                    <>
                        <div className="row" style={{ marginBottom: 16 }}>
                            <Badge tone={verified.jira ? 'passed' : 'neutral'}>
                                {verified.jira ? '✓ verified' : '○ not verified'}
                            </Badge>
                            {verified.jira && (
                                <span className="small muted">
                                    {verified.jira.as} · {new Date(verified.jira.at).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div className="form-grid">
                            <Field label="Site URL" hint="Leave blank to use the server value.">
                                <input
                                    value={jira.baseUrl}
                                    placeholder={server.jira.baseUrl || 'https://your-site.atlassian.net'}
                                    onChange={(e) => setJira({ ...jira, baseUrl: e.target.value })}
                                />
                            </Field>
                            <Field label="Email" hint="The account the API token belongs to.">
                                <input
                                    value={jira.email}
                                    placeholder={server.jira.email || 'you@company.com'}
                                    onChange={(e) => setJira({ ...jira, email: e.target.value })}
                                />
                            </Field>
                            <Field label="API token" hint="Only needed to override the server's token.">
                                <input
                                    type="password"
                                    value={jira.apiToken}
                                    placeholder={
                                        server.jira.hasToken ? '•••••• (using server token)' : 'Required'
                                    }
                                    onChange={(e) => setJira({ ...jira, apiToken: e.target.value })}
                                />
                            </Field>
                            <Field label="Default project key" hint="e.g. SCRUM. Used when no key is typed.">
                                <input
                                    value={jira.projectKey}
                                    placeholder={server.jira.projectKey || 'SCRUM'}
                                    onChange={(e) => setJira({ ...jira, projectKey: e.target.value })}
                                />
                            </Field>
                        </div>

                        <p className="small muted" style={{ marginTop: 14 }}>
                            Acceptance criteria field:{' '}
                            {server.jira.acField ? (
                                <code>{server.jira.acField}</code>
                            ) : (
                                'none configured — criteria are read from the description, stopping at the next section heading.'
                            )}
                        </p>
                    </>
                )}
            </Panel>
        </>
    );
}
