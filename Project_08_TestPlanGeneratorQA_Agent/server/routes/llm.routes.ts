import { Router } from 'express';
import { LOCAL_ONLY_PROVIDERS, resolveLLMConfig } from '../config.js';
import { listModels, testModel } from '../../tools/llm/models.js';
import { LLMProvider } from '../types.js';

const router = Router();

/** GET /api/llm/models?provider=groq — live list for the Settings dropdown. */
router.get('/models', async (req, res, next) => {
    try {
        const provider = String(req.query.provider ?? '') as LLMProvider;
        const config = resolveLLMConfig(provider ? { provider } : {});
        const list = await listModels(config);
        res.json({
            ...list,
            localOnly: LOCAL_ONLY_PROVIDERS.includes(config.provider),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/llm/test — Test Connection for the model.
 * Returns a real completion and its latency, plus whether JSON mode was honoured.
 */
router.post('/test', async (req, res, next) => {
    try {
        const config = resolveLLMConfig(req.body?.llm ?? {});
        const result = await testModel(config);

        // A local model that takes 20s on a trivial prompt cannot finish a plan
        // inside a serverless request (findings.md §11). Say so here, once, rather
        // than letting it time out later.
        const slow = result.latencyMs > 8000;
        res.json({
            ...result,
            localOnly: LOCAL_ONLY_PROVIDERS.includes(config.provider),
            warning: slow
                ? `This model took ${(result.latencyMs / 1000).toFixed(1)}s for a trivial request. ` +
                  `A full plan will take minutes, and will time out on the deployed app. Use it locally, or pick a faster model.`
                : undefined,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
