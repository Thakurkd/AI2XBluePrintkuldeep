/**
 * S9 — share back to Jira. SOP architecture/04_share_export.md.
 *
 * Default behaviour is a short summary comment plus the full plan as an
 * attachment: a 15-section wall of text in a comment gets ignored, which defeats
 * the purpose of sharing it.
 */
import axios, { AxiosInstance } from 'axios';
import { JiraConfig, ShareRecord, TestPlan } from '../../server/types.js';
import { markdownToAdf } from './markdownToAdf.js';

function client(config: JiraConfig): AxiosInstance {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    return axios.create({
        baseURL: config.baseUrl,
        headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
        timeout: 45_000,
    });
}

function describeError(error: any, action: string): Error {
    const status = error.response?.status;
    const messages = error.response?.data?.errorMessages;
    const detail = Array.isArray(messages) && messages.length ? messages.join('; ') : error.message;

    if (status === 401) {
        return Object.assign(new Error('Jira rejected the credentials (401).'), { status: 401 });
    }
    if (status === 403) {
        return Object.assign(
            new Error(
                `Jira denied ${action} (403). The account can read this issue but lacks the permission to ${action}.`
            ),
            { status: 403 }
        );
    }
    if (status === 404) {
        return Object.assign(new Error(`Jira returned 404 for ${action} — check the issue key.`), { status: 404 });
    }
    return Object.assign(new Error(`Jira error during ${action}: ${detail}`), { status: status ?? 502 });
}

export function planFilename(plan: TestPlan): string {
    const key = plan.workItemKeys[0] ?? 'plan';
    return `TestPlan_${key}_v${plan.meta.version || '1.0'}_${plan.createdAt.slice(0, 10)}.md`;
}

/**
 * The comment body. Deliberately a summary and not the whole document: it names
 * what was produced, what is unresolved, and where the full plan is.
 */
export function summaryMarkdown(plan: TestPlan, attachmentName?: string): string {
    const a = plan.analysis;
    const gaps = plan.report?.coverageGaps ?? [];
    const blockers = (plan.review ?? []).filter((f) => f.severity === 'Blocker');

    const lines = [
        `## Test plan generated — ${a.productName}`,
        '',
        `**Work item(s):** ${plan.workItemKeys.join(', ')}  `,
        `**Test cases:** ${plan.testCases.length}  `,
        `**Features in scope:** ${a.features.length}  `,
        `**Model:** ${plan.model.provider} / ${plan.model.model}`,
        '',
        a.objectiveDetail,
        '',
        '**Features to be tested**',
        '',
        ...a.features.slice(0, 8).map((f) => `- ${f.feature} — risk ${f.riskLevel}, ${f.priority} priority`),
    ];

    if (a.features.length > 8) lines.push(`- …and ${a.features.length - 8} more, in the full plan`);

    if (a.openQuestions.length || gaps.length) {
        lines.push('', '**Open questions — answer before execution begins**', '');
        for (const q of [...a.openQuestions, ...gaps].slice(0, 8)) lines.push(`- ${q}`);
    }

    if (blockers.length) {
        lines.push('', `**Review flagged ${blockers.length} blocker(s):**`, '');
        for (const b of blockers.slice(0, 5)) lines.push(`- ${b.section}: ${b.issue}`);
    }

    lines.push(
        '',
        '---',
        '',
        attachmentName
            ? `Full plan attached as \`${attachmentName}\`. This is a first draft that removes the blank page — review every section before approval.`
            : 'This is a first draft that removes the blank page — review every section before approval.'
    );

    return lines.join('\n');
}

/** Post a comment on the issue. The body must be ADF, not markdown. */
export async function postComment(
    config: JiraConfig,
    issueKey: string,
    markdown: string
): Promise<ShareRecord> {
    try {
        const { data } = await client(config).post(
            `/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`,
            { body: markdownToAdf(markdown) },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return {
            target: 'jira-comment',
            ref: `${config.baseUrl}/browse/${issueKey}?focusedCommentId=${data.id}`,
            at: new Date().toISOString(),
        };
    } catch (error) {
        throw describeError(error, `commenting on ${issueKey}`);
    }
}

/** Attach the full plan. Jira requires the no-check token header for uploads. */
export async function attachPlan(
    config: JiraConfig,
    issueKey: string,
    filename: string,
    body: string
): Promise<ShareRecord> {
    // Native FormData/Blob (Node 18+); axios sets the multipart boundary itself.
    const form = new FormData();
    form.append('file', new Blob([body], { type: 'text/markdown' }), filename);

    try {
        const { data } = await client(config).post(
            `/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`,
            form,
            {
                // Jira rejects uploads without this header, as an XSRF guard.
                headers: { 'X-Atlassian-Token': 'no-check' },
                maxBodyLength: Infinity,
            }
        );
        const attachment = Array.isArray(data) ? data[0] : data;
        return {
            target: 'jira-attachment',
            ref: attachment?.content ?? `${config.baseUrl}/browse/${issueKey}`,
            at: new Date().toISOString(),
        };
    } catch (error) {
        throw describeError(error, `attaching ${filename} to ${issueKey}`);
    }
}
