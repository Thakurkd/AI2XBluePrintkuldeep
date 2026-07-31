import type {
    JiraIdentity,
    JiraSettings,
    LLMProvider,
    LLMSettings,
    PlanAnalysis,
    PlanMeta,
    RenderReport,
    ReviewFinding,
    ServerConfig,
    ShareRecord,
    TestCase,
    TestPlan,
    WorkItem,
    WorkItemLink,
} from './types';

/** Only send overrides the user actually typed; blanks fall back to the server's .env. */
function pruned<T extends object>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    ) as Partial<T>;
}

const PASSWORD_KEY = 'testplan-agent:password';

export const session = {
    get: () => sessionStorage.getItem(PASSWORD_KEY) ?? '',
    set: (value: string) => sessionStorage.setItem(PASSWORD_KEY, value),
    clear: () => sessionStorage.removeItem(PASSWORD_KEY),
};

/** Thrown when the deployment is gated and the stored password is missing or stale. */
export class AuthError extends Error {}

async function request<T>(path: string, body?: unknown, method?: 'GET' | 'POST'): Promise<T> {
    const password = session.get();
    const verb = method ?? (body === undefined ? 'GET' : 'POST');

    const response = await fetch(`/api${path}`, {
        method: verb,
        headers: {
            'Content-Type': 'application/json',
            ...(password ? { 'x-app-password': password } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (response.status === 401) {
        session.clear();
        throw new AuthError('Password required.');
    }

    const text = await response.text();
    let payload: any = {};
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        // A non-JSON body means the request never reached the app — a gateway
        // page, a proxy error, or no backend at all. Say which.
        if (response.ok) throw new Error('The server returned a malformed response.');
        if ([502, 504].includes(response.status)) {
            throw new Error(
                'The request timed out before the model replied. That usually means the provider is ' +
                'rate-limiting, or the model is too slow for one request — try a faster model in Settings.'
            );
        }
        throw new Error(
            import.meta.env.DEV
                ? `Server error ${response.status}. Is the API running on port 5008? (npm run dev:api)`
                : `Server error ${response.status}.`
        );
    }

    if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
    return payload as T;
}

export interface ModelList {
    provider: LLMProvider;
    models: string[];
    excluded: string[];
    live: boolean;
    localOnly: boolean;
    note?: string;
}

export interface ModelTest {
    ok: true;
    provider: string;
    model: string;
    latencyMs: number;
    jsonMode: boolean;
    reply: string;
    localOnly: boolean;
    warning?: string;
}

export const api = {
    /** Unauthenticated — tells the UI whether this deployment is gated at all. */
    health: () => request<{ status: string; authRequired: boolean }>('/health'),

    signIn: async (password: string) => {
        session.set(password);
        try {
            await request<{ ok: true }>('/auth', {});
        } catch (error) {
            session.clear();
            throw error;
        }
    },

    serverConfig: () => request<ServerConfig>('/config'),

    testConnection: (jira: JiraSettings) =>
        request<JiraIdentity>('/connections/test', { jira: pruned(jira) }),

    fetchWorkItems: (jira: JiraSettings, id: string, include: string[] = []) =>
        request<{ items: WorkItem[]; available: WorkItemLink[]; count: number }>('/connections/workitems', {
            jira: pruned(jira),
            id,
            include,
        }),

    models: (provider: LLMProvider) =>
        request<ModelList>(`/llm/models?provider=${encodeURIComponent(provider)}`),

    testModel: (llm: LLMSettings) => request<ModelTest>('/llm/test', { llm: pruned(llm) }),

    placeholders: () => request<{ placeholders: string[] }>('/plan/placeholders'),

    validateTemplate: (template: string) =>
        request<{ ok: boolean; unknown: string[]; used: string[] }>('/plan/validate-template', { template }),

    analyze: (args: { workItems: WorkItem[]; additionalContext: string; llm: LLMSettings }) =>
        request<{ analysis: PlanAnalysis; model: { provider: string; model: string } }>('/plan/analyze', {
            ...args,
            llm: pruned(args.llm),
        }),

    cases: (args: {
        workItems: WorkItem[];
        analysis: PlanAnalysis;
        additionalContext: string;
        llm: LLMSettings;
    }) =>
        request<{ testCases: TestCase[]; count: number; model: { provider: string; model: string } }>(
            '/plan/cases',
            { ...args, llm: pruned(args.llm) }
        ),

    /** Deterministic — no model, no key, no rate limit. */
    render: (args: {
        template: string;
        workItems: WorkItem[];
        analysis: PlanAnalysis;
        testCases: TestCase[];
        meta: PlanMeta;
        additionalContext: string;
        generatedBy: string;
    }) => request<{ markdown: string; report: RenderReport }>('/plan/render', args),

    review: (args: {
        markdown: string;
        workItems: WorkItem[];
        testCases: TestCase[];
        llm: LLMSettings;
    }) =>
        request<{ findings: ReviewFinding[]; count: number; dropped: string[] }>('/plan/review', {
            ...args,
            llm: pruned(args.llm),
        }),

    sharePreview: (plan: TestPlan) =>
        request<{ markdown: string; filename: string }>('/share/preview', { plan }),

    shareToJira: (args: {
        plan: TestPlan;
        issueKey: string;
        mode: 'comment' | 'attachment' | 'both';
        jira: JiraSettings;
    }) =>
        request<{ shares: ShareRecord[]; issueKey: string; filename: string }>('/share/jira', {
            ...args,
            jira: pruned(args.jira),
        }),
};
