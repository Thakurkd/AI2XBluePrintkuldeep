import type { ReactNode } from 'react';

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle: string;
    actions?: ReactNode;
}) {
    return (
        <header className="page-header">
            <div>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {actions && <div className="page-header-actions">{actions}</div>}
        </header>
    );
}

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'info' | 'warn'; children: ReactNode }) {
    return <div className={`banner banner-${kind}`}>{children}</div>;
}

export function Panel({
    title,
    hint,
    children,
    actions,
}: {
    title?: string;
    hint?: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <section className="panel">
            {(title || actions) && (
                <div className="panel-head">
                    <div>
                        {title && <h2>{title}</h2>}
                        {hint && <p className="panel-hint">{hint}</p>}
                    </div>
                    {actions && <div className="panel-actions">{actions}</div>}
                </div>
            )}
            <div className="panel-body">{children}</div>
        </section>
    );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
    return (
        <div className="empty-state">
            <p className="empty-title">{title}</p>
            <p className="empty-hint">{hint}</p>
            {action && <div className="empty-action">{action}</div>}
        </div>
    );
}

/** A named spinner. A bare spinner does not say what is being waited for. */
export function Spinner({ label }: { label: string }) {
    return (
        <div className="spinner-row">
            <span className="spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}

export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
    return <span className={`badge badge-${(tone ?? 'neutral').toLowerCase()}`}>{children}</span>;
}

export function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <label className="field">
            <span className="field-label">{label}</span>
            {children}
            {hint && <span className="field-hint">{hint}</span>}
        </label>
    );
}

/**
 * A stat tile carries a value and a denominator or rate. A bare number invites
 * the question it should already have answered.
 */
export function StatTile({
    label,
    value,
    sub,
    tone,
}: {
    label: string;
    value: number | string;
    sub: string;
    tone?: 'good' | 'critical' | 'warning' | 'neutral';
}) {
    return (
        <div className={`stat-tile stat-${tone ?? 'neutral'}`}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            <span className="stat-sub">{sub}</span>
        </div>
    );
}

/** Copy-to-clipboard that reports back, since a silent copy button reads as broken. */
export function CopyButton({ text, className }: { text: string; className?: string }) {
    return (
        <button
            type="button"
            className={className ?? 'btn btn-ghost'}
            onClick={async (event) => {
                const button = event.currentTarget;
                const original = button.textContent;
                try {
                    await navigator.clipboard.writeText(text);
                    button.textContent = 'Copied';
                } catch {
                    button.textContent = 'Copy failed';
                }
                setTimeout(() => {
                    button.textContent = original;
                }, 1500);
            }}
        >
            Copy
        </button>
    );
}
