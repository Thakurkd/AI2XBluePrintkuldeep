/**
 * S4 — requirement analysis (prompt P1).
 *
 * Validation, not trust: a model's near-miss enum is coerced, a missing field is
 * retried once with the validation error appended, and a second failure surfaces
 * the raw response. We never quietly ship a half-parsed analysis
 * (architecture/03_plan_generation.md §S4).
 */
import { LLMConfig, PlanAnalysis, PlanEnvironments, WorkItem } from '../../server/types.js';
import { ANALYZE_SYSTEM, analyzeUser } from '../../server/prompts.js';
import { chat, parseJSON } from '../llm/client.js';

/**
 * The analysis is a 25-field object covering 14 template sections, and it is
 * emitted as one JSON document — so the cap has to fit the whole thing.
 *
 * Measured: 2500 truncated it right after `features`, leaving a dozen sections to
 * fall back to template defaults with no error raised. The client now refuses a
 * truncated reply outright, but the cap still needs to be big enough that a normal
 * story does not trip it.
 */
const ANALYZE_MAX_TOKENS = 4000;

const asStrings = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((v) => String(v ?? '').trim()).filter(Boolean) : [];

const asText = (value: unknown): string => String(value ?? '').trim();

function level(value: unknown, fallback: 'High' | 'Medium' | 'Low' = 'Medium'): 'High' | 'Medium' | 'Low' {
    const raw = String(value ?? '').toLowerCase();
    if (raw.startsWith('h') || /crit|blocker/.test(raw)) return 'High';
    if (raw.startsWith('l') || /minor|trivial/.test(raw)) return 'Low';
    if (raw.startsWith('m')) return 'Medium';
    return fallback;
}

function riskLetter(value: unknown): 'H' | 'M' | 'L' {
    const raw = String(value ?? '').toLowerCase();
    if (raw.startsWith('h')) return 'H';
    if (raw.startsWith('l')) return 'L';
    return 'M';
}

function environments(value: any): PlanEnvironments {
    const v = value ?? {};
    return {
        operatingSystems: asStrings(v.operatingSystems),
        browsers: asStrings(v.browsers),
        devices: asStrings(v.devices),
        network: asStrings(v.network),
        hardwareRequirements: asStrings(v.hardwareRequirements),
        securityProtocols: asStrings(v.securityProtocols),
        accessPermissions: asStrings(v.accessPermissions),
        baseUrl: asText(v.baseUrl),
    };
}

/** Coerce whatever the model returned into a valid PlanAnalysis. */
function normalise(raw: any, items: WorkItem[]): PlanAnalysis {
    const keys = new Set(items.map((i) => i.key.toUpperCase()));
    const fallbackKey = items[0]?.key ?? '';

    return {
        productName: asText(raw.productName) || items[0]?.title || '',
        targetAudience: asText(raw.targetAudience),
        objectiveDetail: asText(raw.objectiveDetail),
        testObjectives: asStrings(raw.testObjectives),
        introduction: asText(raw.introduction),

        features: (Array.isArray(raw.features) ? raw.features : [])
            .filter((f: any) => f && asText(f.feature))
            .map((f: any) => {
                const supplied = asText(f.workItemKey).toUpperCase();
                return {
                    // A key the model invented is worse than no attribution at all.
                    workItemKey: keys.has(supplied) ? supplied : fallbackKey,
                    feature: asText(f.feature),
                    riskLevel: riskLetter(f.riskLevel),
                    priority: level(f.priority),
                    rationale: asText(f.rationale),
                };
            }),

        testingTypes: asStrings(raw.testingTypes),
        evaluationCriteria: asStrings(raw.evaluationCriteria),
        teamRoles: (Array.isArray(raw.teamRoles) ? raw.teamRoles : [])
            .filter((r: any) => r && asText(r.role))
            .map((r: any) => ({ role: asText(r.role), responsibility: asText(r.responsibility) })),

        exclusions: (Array.isArray(raw.exclusions) ? raw.exclusions : [])
            .map((e: any) => (typeof e === 'string' ? { item: e, basis: 'inferred' } : e))
            .filter((e: any) => e && asText(e.item))
            .map((e: any) => ({
                item: asText(e.item),
                // Default to "inferred": claiming the ticket stated something it
                // did not is the more damaging of the two mistakes.
                basis: String(e.basis).toLowerCase() === 'stated' ? 'stated' : 'inferred',
            })),

        environments: environments(raw.environments),

        defectCriteria: asStrings(raw.defectCriteria),
        defectTrackingTool: asText(raw.defectTrackingTool),
        communicationChannels: asStrings(raw.communicationChannels),
        defectMetrics: asStrings(raw.defectMetrics),

        testTechniques: asStrings(raw.testTechniques),
        smokeScope: asText(raw.smokeScope),
        e2eFlows: asStrings(raw.e2eFlows),

        schedule: (Array.isArray(raw.schedule) ? raw.schedule : [])
            .filter((s: any) => s && asText(s.task))
            .map((s: any) => ({ task: asText(s.task), duration: asText(s.duration), owner: asText(s.owner) })),
        timeline: asText(raw.timeline),

        deliverables: asStrings(raw.deliverables),

        entryExitCriteria: (Array.isArray(raw.entryExitCriteria) ? raw.entryExitCriteria : [])
            .filter((p: any) => p && asText(p.phase))
            .map((p: any) => ({
                phase: asText(p.phase),
                entry: asStrings(p.entry),
                exit: asStrings(p.exit),
            })),

        tools: (Array.isArray(raw.tools) ? raw.tools : [])
            .map((t: any) => (typeof t === 'string' ? { name: t, purpose: '' } : t))
            .filter((t: any) => t && asText(t.name))
            .map((t: any) => ({ name: asText(t.name), purpose: asText(t.purpose) })),

        risks: (Array.isArray(raw.risks) ? raw.risks : [])
            .filter((r: any) => r && asText(r.risk))
            .map((r: any) => ({
                risk: asText(r.risk),
                impact: level(r.impact),
                likelihood: level(r.likelihood),
                mitigation: asText(r.mitigation),
            })),

        assumptions: asStrings(raw.assumptions),
        openQuestions: asStrings(raw.openQuestions),
    };
}

/** What must be present for the plan to have substance (render.ts REQUIRED). */
function shortfall(analysis: PlanAnalysis): string[] {
    const missing: string[] = [];
    if (!analysis.productName) missing.push('productName');
    if (!analysis.features.length) missing.push('features');
    if (!analysis.testObjectives.length) missing.push('testObjectives');
    return missing;
}

export async function analyzeRequirements(
    llm: LLMConfig,
    items: WorkItem[],
    additionalContext = '',
    tracker = 'Jira'
): Promise<PlanAnalysis> {
    const user = analyzeUser(items, additionalContext, tracker);

    let raw = await chat(llm, ANALYZE_SYSTEM, user, { temperature: 0.15, maxTokens: ANALYZE_MAX_TOKENS, json: true });
    let analysis = normalise(parseJSON<any>(raw), items);
    let missing = shortfall(analysis);

    if (missing.length) {
        // One retry, telling the model exactly what it omitted. Cheaper than
        // failing the run, and honest about why it is asking again.
        raw = await chat(
            llm,
            ANALYZE_SYSTEM,
            `${user}\n\n---\n\nYour previous response omitted required fields: ${missing.join(
                ', '
            )}. Return the complete JSON object with those fields populated from the work item.`,
            { temperature: 0.15, maxTokens: ANALYZE_MAX_TOKENS, json: true }
        );
        analysis = normalise(parseJSON<any>(raw), items);
        missing = shortfall(analysis);
    }

    if (missing.length) {
        throw Object.assign(
            new Error(
                `The model did not produce ${missing.join(', ')} after a retry. ` +
                `The work item may be too thin to plan from, or the model too small — try a stronger one in Settings.`
            ),
            { status: 502 }
        );
    }

    return analysis;
}
