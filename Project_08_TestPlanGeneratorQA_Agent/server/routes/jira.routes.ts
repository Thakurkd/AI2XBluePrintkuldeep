import { Router } from 'express';
import { resolveJiraConfig } from '../config.js';
import { fetchWorkItems, verifyConnection } from '../../tools/connectors/jira.js';

const router = Router();

/**
 * POST /api/connections/test — the Test Connection contract.
 * Returns the identity behind the credential, not `ok` (gemini.md invariant 4).
 */
router.post('/test', async (req, res, next) => {
    try {
        const config = resolveJiraConfig(req.body?.jira ?? {});
        const identity = await verifyConnection(config);
        res.json(identity);
    } catch (error) {
        next(error);
    }
});

/** POST /api/connections/workitems — an id in, canonical work items out. */
router.post('/workitems', async (req, res, next) => {
    try {
        const { id, include } = req.body ?? {};
        if (!String(id ?? '').trim()) {
            throw Object.assign(new Error('Enter a work-item id, for example SCRUM-5.'), { status: 400 });
        }

        const config = resolveJiraConfig(req.body?.jira ?? {});
        const result = await fetchWorkItems(
            config,
            String(id),
            Array.isArray(include) ? include.map(String) : []
        );

        res.json({
            items: result.items,
            available: result.available,
            count: result.items.length,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
