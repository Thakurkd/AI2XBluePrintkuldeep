import { Router } from 'express';
import { resolveLLMConfig } from '../config.js';
import { chat, parseJSON, stripCodeFences } from '../services/llm.service.js';
import { repairGeneratedCode } from '../services/codeRepair.js';
import {
    TEST_CASES_SYSTEM,
    TEST_PLAN_SYSTEM,
    codeGenSystem,
    codeGenUser,
    testCasesUser,
    testPlanUser,
} from '../prompts.js';
import { CodeLanguage, Framework, TestCase, UserStory } from '../types.js';

const router = Router();

const FRAMEWORKS: Framework[] = ['playwright', 'selenium'];
const LANGUAGES: CodeLanguage[] = ['typescript', 'javascript', 'java', 'python', 'csharp'];

function requireStories(body: any): UserStory[] {
    const stories = body?.stories;
    if (!Array.isArray(stories) || stories.length === 0) {
        throw Object.assign(new Error('Select at least one user story first.'), { status: 400 });
    }
    return stories;
}

/** POST /api/generate/test-plan - stories in, Markdown test plan out. */
router.post('/test-plan', async (req, res, next) => {
    try {
        const stories = requireStories(req.body);
        const llm = resolveLLMConfig(req.body?.llm ?? {});
        const markdown = await chat(llm, TEST_PLAN_SYSTEM, testPlanUser(stories), {
            temperature: 0.3,
            maxTokens: 4000,
        });

        res.json({
            testPlan: {
                storyKeys: stories.map((s) => s.key),
                markdown: markdown.trim(),
                generatedAt: new Date().toISOString(),
                model: llm.model,
            },
        });
    } catch (error) {
        next(error);
    }
});

/** POST /api/generate/test-cases - stories (+ optional plan) in, structured cases out. */
router.post('/test-cases', async (req, res, next) => {
    try {
        const stories = requireStories(req.body);
        const llm = resolveLLMConfig(req.body?.llm ?? {});
        const raw = await chat(
            llm,
            TEST_CASES_SYSTEM,
            testCasesUser(stories, req.body?.testPlanMarkdown),
            { temperature: 0.2, json: true, maxTokens: 5000 }
        );

        const parsed = parseJSON<{ testCases: TestCase[] }>(raw);
        const testCases = (Array.isArray(parsed) ? parsed : parsed.testCases) ?? [];
        if (!testCases.length) {
            throw Object.assign(new Error('The model returned no test cases. Try again or switch models.'), {
                status: 502,
            });
        }

        // Re-key defensively: models drift on id format and duplicate numbers across stories.
        const counters = new Map<string, number>();
        const normalised = testCases.map((tc) => {
            const storyKey = tc.storyKey || stories[0].key;
            const n = (counters.get(storyKey) ?? 0) + 1;
            counters.set(storyKey, n);
            return {
                ...tc,
                storyKey,
                id: `${storyKey}-TC-${String(n).padStart(3, '0')}`,
                preconditions: tc.preconditions ?? [],
                steps: tc.steps ?? [],
                status: tc.status || 'Draft',
            };
        });

        res.json({ testCases: normalised, count: normalised.length, model: llm.model });
    } catch (error) {
        next(error);
    }
});

/** POST /api/generate/code - one test case in, runnable automation code out. */
router.post('/code', async (req, res, next) => {
    try {
        const { testCase, story, framework = 'playwright', language = 'typescript' } = req.body ?? {};

        if (!testCase?.title) {
            throw Object.assign(new Error('Select a test case to generate code for.'), { status: 400 });
        }
        if (!FRAMEWORKS.includes(framework)) {
            throw Object.assign(new Error(`framework must be one of: ${FRAMEWORKS.join(', ')}`), {
                status: 400,
            });
        }
        if (!LANGUAGES.includes(language)) {
            throw Object.assign(new Error(`language must be one of: ${LANGUAGES.join(', ')}`), {
                status: 400,
            });
        }

        const llm = resolveLLMConfig(req.body?.llm ?? {});
        const raw = await chat(
            llm,
            codeGenSystem(framework, language),
            codeGenUser(testCase, story),
            { temperature: 0.1, maxTokens: 3000 }
        );

        res.json({
            generated: {
                testCaseId: testCase.id,
                framework,
                language,
                code: repairGeneratedCode(stripCodeFences(raw), framework, language),
                generatedAt: new Date().toISOString(),
                model: llm.model,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
