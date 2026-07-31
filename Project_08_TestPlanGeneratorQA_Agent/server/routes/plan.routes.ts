/**
 * The pipeline endpoints. The client calls them in sequence — analyze, cases,
 * render, review — because three chained LLM calls in one request exceed Vercel's
 * 60s ceiling on any slow model (findings.md §4). Each call here is comfortably
 * inside the limit and reports its own progress.
 */
import { Router } from 'express';
import { resolveLLMConfig } from '../config.js';
import { analyzeRequirements } from '../../tools/plan/analyze.js';
import { deriveTestCases } from '../../tools/plan/cases.js';
import { render, supportedPlaceholders, validateTemplate } from '../../tools/plan/render.js';
import { reviewPlan } from '../../tools/plan/review.js';
import { PlanAnalysis, PlanMeta, TestCase, WorkItem } from '../types.js';

const router = Router();

/** Templates are user-editable client state, so they arrive with the request. */
const MAX_TEMPLATE_BYTES = 200_000;

function requireWorkItems(body: any): WorkItem[] {
    const items = body?.workItems;
    if (!Array.isArray(items) || !items.length) {
        throw Object.assign(new Error('Fetch a work item before generating a plan.'), { status: 400 });
    }
    return items;
}

function requireTemplate(body: any): string {
    const template = String(body?.template ?? '');
    if (!template.trim()) {
        throw Object.assign(new Error('No template was supplied.'), { status: 400 });
    }
    if (template.length > MAX_TEMPLATE_BYTES) {
        throw Object.assign(
            new Error(`The template is ${Math.round(template.length / 1024)} KB; the limit is 200 KB.`),
            { status: 413 }
        );
    }
    return template;
}

function requireAnalysis(body: any): PlanAnalysis {
    const analysis = body?.analysis;
    if (!analysis || typeof analysis !== 'object') {
        throw Object.assign(new Error('Run the analysis step first.'), { status: 400 });
    }
    return analysis as PlanAnalysis;
}

function meta(body: any): PlanMeta {
    const m = body?.meta ?? {};
    return {
        author: String(m.author ?? '').trim(),
        version: String(m.version ?? '').trim() || '1.0',
        environment: String(m.environment ?? '').trim(),
        browser: String(m.browser ?? '').trim(),
        baseUrl: String(m.baseUrl ?? '').trim(),
    };
}

/** GET /api/plan/placeholders — the contract the Templates editor validates against. */
router.get('/placeholders', (_req, res) => {
    res.json({ placeholders: supportedPlaceholders() });
});

/** POST /api/plan/validate-template — save-time validation, not runtime surprise. */
router.post('/validate-template', (req, res, next) => {
    try {
        res.json(validateTemplate(requireTemplate(req.body)));
    } catch (error) {
        next(error);
    }
});

/** POST /api/plan/analyze — S4. */
router.post('/analyze', async (req, res, next) => {
    try {
        const items = requireWorkItems(req.body);
        const llm = resolveLLMConfig(req.body?.llm ?? {});
        const tracker = items[0]?.source === 'jira' ? 'Jira' : String(items[0]?.source ?? 'the tracker');

        const analysis = await analyzeRequirements(
            llm,
            items,
            String(req.body?.additionalContext ?? ''),
            tracker
        );

        res.json({ analysis, model: { provider: llm.provider, model: llm.model } });
    } catch (error) {
        next(error);
    }
});

/** POST /api/plan/cases — S5. */
router.post('/cases', async (req, res, next) => {
    try {
        const items = requireWorkItems(req.body);
        const analysis = requireAnalysis(req.body);
        const llm = resolveLLMConfig(req.body?.llm ?? {});

        const testCases = await deriveTestCases(
            llm,
            items,
            analysis,
            String(req.body?.additionalContext ?? '')
        );

        res.json({
            testCases,
            count: testCases.length,
            model: { provider: llm.provider, model: llm.model },
        });
    } catch (error) {
        next(error);
    }
});

/** POST /api/plan/render — S6. Deterministic: no LLM, no key needed. */
router.post('/render', (req, res, next) => {
    try {
        const items = requireWorkItems(req.body);
        const analysis = requireAnalysis(req.body);
        const template = requireTemplate(req.body);
        const testCases: TestCase[] = Array.isArray(req.body?.testCases) ? req.body.testCases : [];

        const { markdown, report } = render({
            template,
            workItems: items,
            analysis,
            testCases,
            meta: meta(req.body),
            additionalContext: String(req.body?.additionalContext ?? ''),
            generatedBy: String(req.body?.generatedBy ?? 'Test Plan Generator (QA Agent)'),
        });

        res.json({ markdown, report });
    } catch (error) {
        next(error);
    }
});

/** POST /api/plan/review — S7, optional. */
router.post('/review', async (req, res, next) => {
    try {
        const items = requireWorkItems(req.body);
        const markdown = String(req.body?.markdown ?? '');
        if (!markdown.trim()) {
            throw Object.assign(new Error('There is no plan to review yet.'), { status: 400 });
        }
        const llm = resolveLLMConfig(req.body?.llm ?? {});
        const testCases: TestCase[] = Array.isArray(req.body?.testCases) ? req.body.testCases : [];

        const { findings, dropped } = await reviewPlan(llm, markdown, items, testCases);
        res.json({
            findings,
            count: findings.length,
            // What the reviewer was not shown. A capped review that looks complete
            // is worse than one that says what it skipped.
            dropped,
            model: { provider: llm.provider, model: llm.model },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
