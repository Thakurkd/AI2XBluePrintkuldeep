/**
 * S5 — test case derivation (prompt P2).
 *
 * Ids and enums are assigned in code, not requested from the model
 * (tools/util/ids.ts). Coverage is checked in code too: a criterion with no case
 * becomes an open question in the document rather than a retry loop.
 */
import { LLMConfig, PlanAnalysis, TestCase, WorkItem } from '../../server/types.js';
import { CASES_SYSTEM, casesUser } from '../../server/prompts.js';
import { chat, parseJSON } from '../llm/client.js';
import { assignIds } from '../util/ids.js';

export async function deriveTestCases(
    llm: LLMConfig,
    items: WorkItem[],
    analysis: PlanAnalysis,
    additionalContext = ''
): Promise<TestCase[]> {
    /**
     * 8 acceptance criteria produce 11+ fully specified cases, and at 4000 tokens
     * that ran off the end — refused, correctly, but the run was lost.
     *
     * 5000 is the practical ceiling on Groq's free tier: the prompt is ~2,500
     * tokens and a single request may not exceed the 8,000/minute window. Past
     * that the fix is to split the work across calls rather than to keep raising
     * this number — see the error below.
     */
    const raw = await chat(llm, CASES_SYSTEM, casesUser(items, analysis, additionalContext), {
        temperature: 0.2,
        maxTokens: 5000,
        json: true,
    });

    let parsed: any;
    try {
        parsed = parseJSON<any>(raw);
    } catch (error: any) {
        // The likely cause is size, and the actionable advice is about scope, not
        // about JSON. Say the thing the user can act on.
        const criteria = items.reduce((n, i) => n + i.acceptanceCriteria.length, 0);
        throw Object.assign(
            new Error(
                `${error.message}\n\nThese ${items.length} work item(s) carry ${criteria} acceptance criteria, ` +
                `which may be more than one response can hold. Generate for fewer items at a time, ` +
                `or pick a model with a larger output limit in Settings.`
            ),
            { status: 502 }
        );
    }

    const list = Array.isArray(parsed) ? parsed : (parsed?.testCases ?? parsed?.test_cases ?? []);

    if (!Array.isArray(list) || !list.length) {
        throw Object.assign(
            new Error(
                'The model returned no test cases. Try again, or switch to a stronger model in Settings.'
            ),
            { status: 502 }
        );
    }

    const testCases = assignIds(list, items);
    if (!testCases.length) {
        throw Object.assign(
            new Error('The model returned test cases with no titles, so none could be used.'),
            { status: 502 }
        );
    }
    return testCases;
}
