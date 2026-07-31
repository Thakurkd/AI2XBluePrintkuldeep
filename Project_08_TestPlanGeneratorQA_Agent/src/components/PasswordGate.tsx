import { useEffect, useState, type ReactNode } from 'react';
import { AuthError, api, session } from '../api';

/**
 * The deployed API holds a Jira token and an LLM key, so every route behind /api
 * is a capability someone else could use. Locally APP_PASSWORD is unset and this
 * gate resolves open without a prompt.
 */
export default function PasswordGate({ children }: { children: ReactNode }) {
    const [state, setState] = useState<'checking' | 'open' | 'locked'>('checking');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.health()
            .then(async ({ authRequired }) => {
                if (!authRequired) return setState('open');
                if (!session.get()) return setState('locked');
                try {
                    // A stored password can be stale after a redeploy.
                    await api.signIn(session.get());
                    setState('open');
                } catch {
                    setState('locked');
                }
            })
            .catch(() => {
                // If health itself fails the API is down, not gated. Let the app
                // load so its own error messages can say what is wrong.
                setState('open');
            });
    }, []);

    if (state === 'checking') {
        return (
            <div className="gate">
                <div className="spinner-row">
                    <span className="spinner" aria-hidden="true" />
                    <span>Connecting…</span>
                </div>
            </div>
        );
    }

    if (state === 'open') return <>{children}</>;

    return (
        <div className="gate">
            <form
                className="gate-card"
                onSubmit={async (event) => {
                    event.preventDefault();
                    setBusy(true);
                    setError(null);
                    try {
                        await api.signIn(password);
                        setState('open');
                    } catch (e) {
                        setError(
                            e instanceof AuthError ? 'That password is not right.' : (e as Error).message
                        );
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                <h1>Test Plan Generator</h1>
                <p>This deployment is password protected because the API holds a Jira token and a model key.</p>

                {error && <div className="banner banner-error">{error}</div>}

                <label className="field">
                    <span className="field-label">Password</span>
                    <input
                        type="password"
                        value={password}
                        autoFocus
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                    disabled={busy || !password}
                >
                    {busy ? 'Checking…' : 'Continue'}
                </button>
            </form>
        </div>
    );
}
