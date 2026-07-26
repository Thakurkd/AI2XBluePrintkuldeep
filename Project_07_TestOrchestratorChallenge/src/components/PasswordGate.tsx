import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, session } from '../api';
import { Banner, Spinner } from './ui';

type State = 'checking' | 'open' | 'locked';

/**
 * The API carries a Jira token and an LLM key, so a public deployment gates
 * every route behind a shared password. Locally APP_PASSWORD is unset and this
 * resolves straight to 'open'.
 */
export default function PasswordGate({ children }: { children: ReactNode }) {
    const [state, setState] = useState<State>('checking');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const { authRequired } = await api.health();
                if (cancelled) return;
                if (!authRequired) {
                    setState('open');
                    return;
                }
                const stored = session.get();
                if (!stored) {
                    setState('locked');
                    return;
                }
                // A stored password goes stale when the env var changes.
                await api.signIn(stored);
                if (!cancelled) setState('open');
            } catch {
                if (!cancelled) setState('locked');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await api.signIn(password);
            setState('open');
        } catch {
            setError('That password was not accepted.');
        } finally {
            setBusy(false);
        }
    }

    if (state === 'checking') {
        return (
            <div className="gate">
                <Spinner label="Checking access…" />
            </div>
        );
    }

    if (state === 'open') return <>{children}</>;

    return (
        <div className="gate">
            <form className="gate-card" onSubmit={submit}>
                <div className="brand">
                    <span className="brand-mark">🚀</span>
                    <span className="brand-name">Test Orchestrator</span>
                </div>
                <p className="muted small">
                    This deployment reads a Jira project and spends an LLM quota, so it is
                    password protected.
                </p>

                {error && <Banner kind="error">{error}</Banner>}

                <label className="field">
                    <span className="field-label">Password</span>
                    <input
                        type="password"
                        value={password}
                        autoFocus
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <button type="submit" className="btn btn-primary" disabled={busy || !password}>
                    {busy ? 'Checking…' : 'Unlock'}
                </button>
            </form>
        </div>
    );
}
