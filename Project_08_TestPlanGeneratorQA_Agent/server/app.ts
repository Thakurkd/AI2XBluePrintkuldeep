import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { configStatus } from './config.js';
import connectionRoutes from './routes/jira.routes.js';
import llmRoutes from './routes/llm.routes.js';
import planRoutes from './routes/plan.routes.js';
import shareRoutes from './routes/share.routes.js';

/** Constant-time compare so the gate does not leak the password a byte at a time. */
function matches(supplied: string, expected: string): boolean {
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * The API holds a Jira token and an LLM key, so on a public deployment every
 * route it serves is a capability someone else could use. When APP_PASSWORD is
 * set, callers must present it. Unset (local dev), the gate stays open.
 */
function passwordGate(req: Request, res: Response, next: NextFunction) {
    const expected = (process.env.APP_PASSWORD ?? '').trim();
    if (!expected) return next();

    const supplied = String(req.header('x-app-password') ?? '');
    if (supplied && matches(supplied, expected)) return next();

    res.status(401).json({ error: 'Password required.', authRequired: true });
}

export function createApp() {
    const app = express();

    app.use(cors({ origin: true, credentials: true }));
    // Plans carry the rendered document and the template, so the default 100kb
    // limit is too small.
    app.use(express.json({ limit: '5mb' }));

    // Unauthenticated: liveness, and whether the gate is even switched on.
    app.get('/api/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'testplan-qa-agent',
            authRequired: Boolean((process.env.APP_PASSWORD ?? '').trim()),
        });
    });

    // Lets the UI check a password without side effects.
    app.post('/api/auth', passwordGate, (_req, res) => {
        res.json({ ok: true });
    });

    app.use('/api', passwordGate);

    app.get('/api/config', (_req, res) => {
        res.json(configStatus());
    });

    app.use('/api/connections', connectionRoutes);
    app.use('/api/llm', llmRoutes);
    app.use('/api/plan', planRoutes);
    app.use('/api/share', shareRoutes);

    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = error.status ?? 500;
        if (status >= 500) console.error('[error]', error.message);
        res.status(status).json({ error: error.message ?? 'Unexpected server error' });
    });

    return app;
}
