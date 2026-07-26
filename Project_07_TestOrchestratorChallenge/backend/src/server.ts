import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { PORT, configStatus } from './config';
import jiraRoutes from './routes/jira.routes';
import generateRoutes from './routes/generate.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'test-orchestrator-backend' });
});

/** What is configured on the server, so Settings can show it without holding secrets. */
app.get('/api/config', (_req, res) => {
    res.json(configStatus());
});

app.use('/api/jira', jiraRoutes);
app.use('/api/generate', generateRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.status ?? 500;
    if (status >= 500) console.error('[error]', error.message);
    res.status(status).json({ error: error.message ?? 'Unexpected server error' });
});

app.listen(PORT, () => {
    console.log(`Test Orchestrator API listening on http://localhost:${PORT}`);
});
