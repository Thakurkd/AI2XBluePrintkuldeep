import { Router } from 'express';
import { resolveJiraConfig } from '../config.js';
import { fetchUserStories, fetchUserStory, listProjects, verifyConnection } from '../services/jira.service.js';

const router = Router();

/** POST /api/jira/verify - confirm the stored credentials reach Jira. */
router.post('/verify', async (req, res, next) => {
    try {
        const config = resolveJiraConfig(req.body?.jira ?? {});
        res.json(await verifyConnection(config));
    } catch (error) {
        next(error);
    }
});

/** GET /api/jira/projects - projects the credentials can see. */
router.get('/projects', async (_req, res, next) => {
    try {
        const config = resolveJiraConfig();
        res.json({ projects: await listProjects(config) });
    } catch (error) {
        next(error);
    }
});

/** POST /api/jira/stories - fetch user stories by project key or raw JQL. */
router.post('/stories', async (req, res, next) => {
    try {
        const { jira = {}, projectKey, jql, maxResults } = req.body ?? {};
        const config = resolveJiraConfig(jira);
        const stories = await fetchUserStories(config, { projectKey, jql, maxResults });
        res.json({ stories, count: stories.length });
    } catch (error) {
        next(error);
    }
});

/** GET /api/jira/stories/:key - one story, refreshed. */
router.get('/stories/:key', async (req, res, next) => {
    try {
        const config = resolveJiraConfig();
        res.json({ story: await fetchUserStory(config, req.params.key) });
    } catch (error) {
        next(error);
    }
});

export default router;
