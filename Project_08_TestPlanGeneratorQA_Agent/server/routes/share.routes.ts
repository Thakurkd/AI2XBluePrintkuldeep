/**
 * Sharing. Every route here writes to someone else's ticket, so the client must
 * have confirmed the exact destination first (gemini.md invariant 5) — the API
 * requires the target issue key explicitly rather than inferring it.
 */
import { Router } from 'express';
import { resolveJiraConfig } from '../config.js';
import { attachPlan, planFilename, postComment, summaryMarkdown } from '../../tools/share/jira.js';
import { markdownToAdf } from '../../tools/share/markdownToAdf.js';
import { ShareRecord, TestPlan } from '../types.js';

const router = Router();

function requirePlan(body: any): TestPlan {
    const plan = body?.plan;
    if (!plan || !Array.isArray(plan.workItemKeys) || !plan.workItemKeys.length) {
        throw Object.assign(new Error('No plan was supplied to share.'), { status: 400 });
    }
    if (!String(plan.markdown ?? '').trim()) {
        throw Object.assign(new Error('This plan has no rendered document to share.'), { status: 400 });
    }
    // A test plan with no test cases is not a deliverable (SOP 04 §Edge cases).
    if (!Array.isArray(plan.testCases) || !plan.testCases.length) {
        throw Object.assign(
            new Error('This plan has no test cases. Generate them before sharing it.'),
            { status: 400 }
        );
    }
    return plan as TestPlan;
}

/**
 * POST /api/share/jira
 * body: { plan, issueKey, mode: 'comment' | 'attachment' | 'both', jira? }
 */
router.post('/jira', async (req, res, next) => {
    try {
        const plan = requirePlan(req.body);
        const issueKey = String(req.body?.issueKey ?? plan.workItemKeys[0]).trim();
        const mode = String(req.body?.mode ?? 'both');

        if (!['comment', 'attachment', 'both'].includes(mode)) {
            throw Object.assign(new Error(`mode must be comment, attachment, or both — got "${mode}".`), {
                status: 400,
            });
        }

        const config = resolveJiraConfig(req.body?.jira ?? {});
        const filename = planFilename(plan);
        const shares: ShareRecord[] = [];

        // Attach first: the comment references the attachment by name, so a
        // comment that survives a failed upload would point at nothing.
        if (mode === 'attachment' || mode === 'both') {
            shares.push(await attachPlan(config, issueKey, filename, plan.markdown));
        }
        if (mode === 'comment' || mode === 'both') {
            const body = summaryMarkdown(plan, mode === 'both' ? filename : undefined);
            shares.push(await postComment(config, issueKey, body));
        }

        res.json({ shares, issueKey, filename });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/share/preview — what the comment will look like, before it is posted.
 * Nothing leaves the app; this exists so the confirmation dialog can show the
 * real payload rather than asking the user to trust it.
 */
router.post('/preview', (req, res, next) => {
    try {
        const plan = requirePlan(req.body);
        const markdown = summaryMarkdown(plan, planFilename(plan));
        res.json({ markdown, adf: markdownToAdf(markdown), filename: planFilename(plan) });
    } catch (error) {
        next(error);
    }
});

export default router;
