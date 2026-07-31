/**
 * S7 — the adversarial reviewer (prompt P3), the self-annealing step.
 *
 * Returns findings; never rewrites. The tester applies them. An empty array is a
 * valid answer, and a model that manufactures findings to look thorough is worse
 * than one that finds nothing (architecture/03_plan_generation.md §S7).
 */
import { LLMConfig, ReviewFinding, TestCase, WorkItem } from '../../server/types.js';
import { REVIEW_SYSTEM, reviewUser } from '../../server/prompts.js';
import { chat, parseJSON } from '../llm/client.js';

const SEVERITIES: ReviewFinding['severity'][] = ['Blocker', 'Major', 'Minor'];

function severity(value: unknown): ReviewFinding['severity'] {
    const raw = String(value ?? '').toLowerCase();
    const match = SEVERITIES.find((s) => s.toLowerCase() === raw);
    if (match) return match;
    if (/block|critical|high/.test(raw)) return 'Blocker';
    if (/minor|low|nit/.test(raw)) return 'Minor';
    return 'Major';
}

const RANK: Record<ReviewFinding['severity'], number> = { Blocker: 0, Major: 1, Minor: 2 };

/**
 * Sections that are pure company boilerplate. The prompt already tells the
 * reviewer to ignore them, so sending them spends the token budget on text that
 * cannot produce a finding.
 *
 * This is not just tidiness: a full 24k-character plan plus its work items came to
 * 8,446 tokens, over Groq's 8,000-per-minute ceiling for a single request, so the
 * review could not run at all on a free tier.
 */
const BOILERPLATE_HEADINGS = [
    /^#\s*5\.\s*Test Environments/i,
    /^#\s*6\.\s*Defect Reporting/i,
    /^#\s*9\.\s*Test Deliverables/i,
    /^#\s*15\.\s*Approvals/i,
];

/** Characters of plan text we will send. Roughly 4 chars per token. */
const PLAN_BUDGET_CHARS = 13_000;

const CASE_DETAIL_HEADING = /^#\s*13\.\s*Test Cases/i;

/**
 * Trim the plan to what a reviewer can actually act on, and report what was left
 * out. A silent truncation would let the reviewer report "vague steps" for steps
 * it was never shown — so when the case detail is dropped, the prompt says so.
 */
export function reviewablePlan(markdown: string): { text: string; dropped: string[] } {
    // Split on top-level headings, keeping each heading with its body.
    const parts = markdown.split(/\n(?=#\s)/);
    const dropped: string[] = [];

    let kept = parts.filter((part) => {
        const heading = part.split('\n')[0];
        if (BOILERPLATE_HEADINGS.some((pattern) => pattern.test(heading))) {
            dropped.push(heading.replace(/^#\s*/, '').trim());
            return false;
        }
        return true;
    });

    // Still too big? The case detail is the largest generated block; the coverage
    // list in the prompt keeps ids and titles either way.
    if (kept.join('\n').length > PLAN_BUDGET_CHARS) {
        kept = kept.filter((part) => {
            if (CASE_DETAIL_HEADING.test(part.split('\n')[0])) {
                dropped.push('13. Test Cases (step-by-step detail)');
                return false;
            }
            return true;
        });
    }

    return { text: kept.join('\n').trim(), dropped };
}

export interface ReviewResult {
    findings: ReviewFinding[];
    /** Sections withheld to fit the token budget. Surfaced, never silent. */
    dropped: string[];
}

export async function reviewPlan(
    llm: LLMConfig,
    markdown: string,
    items: WorkItem[],
    testCases: TestCase[]
): Promise<ReviewResult> {
    const { text, dropped } = reviewablePlan(markdown);

    // 1500 was too small: a reviewer with several findings ran past it, and Groq
    // rejects a truncated json_object outright with "Failed to validate JSON"
    // rather than reporting finish_reason=length.
    const raw = await chat(llm, REVIEW_SYSTEM, reviewUser(text, items, testCases, dropped), {
        temperature: 0.1,
        maxTokens: 2500,
        json: true,
    });

    const parsed = parseJSON<any>(raw);
    const list = Array.isArray(parsed) ? parsed : (parsed?.findings ?? []);
    if (!Array.isArray(list)) return { findings: [], dropped };

    const findings = list
        .filter((f: any) => f && String(f.issue ?? '').trim())
        .map((f: any) => ({
            section: String(f.section ?? '').trim() || 'Unspecified section',
            severity: severity(f.severity),
            issue: String(f.issue).trim(),
            evidence: String(f.evidence ?? '').trim(),
            fix: String(f.fix ?? '').trim(),
        }))
        .sort((a, b) => RANK[a.severity] - RANK[b.severity]);

    return { findings, dropped };
}
