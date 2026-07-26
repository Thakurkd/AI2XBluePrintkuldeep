import type {
    CodeLanguage,
    Framework,
    GeneratedCode,
    JiraSettings,
    LLMSettings,
    ServerConfig,
    TestCase,
    TestPlan,
    UserStory,
} from './types';

/** Only send overrides the user actually typed; blanks fall back to the server's .env. */
function pruned<T extends object>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    ) as Partial<T>;
}

async function request<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`/api${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const text = await response.text();
    let payload: any = {};
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        throw new Error(
            response.ok
                ? 'The server returned a malformed response.'
                : `Server error ${response.status}. Is the backend running on port 5007?`
        );
    }

    if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
    return payload as T;
}

export const api = {
    serverConfig: () => request<ServerConfig>('/config'),

    verifyJira: (jira: JiraSettings) =>
        request<{ ok: true; displayName: string; email: string; baseUrl: string }>('/jira/verify', {
            jira: pruned(jira),
        }),

    fetchStories: (jira: JiraSettings, opts: { projectKey?: string; jql?: string; maxResults?: number }) =>
        request<{ stories: UserStory[]; count: number }>('/jira/stories', {
            jira: pruned(jira),
            ...opts,
        }),

    generateTestPlan: (stories: UserStory[], llm: LLMSettings) =>
        request<{ testPlan: TestPlan }>('/generate/test-plan', { stories, llm: pruned(llm) }),

    generateTestCases: (stories: UserStory[], llm: LLMSettings, testPlanMarkdown?: string) =>
        request<{ testCases: TestCase[]; count: number; model: string }>('/generate/test-cases', {
            stories,
            llm: pruned(llm),
            testPlanMarkdown,
        }),

    generateCode: (args: {
        testCase: TestCase;
        story?: UserStory;
        framework: Framework;
        language: CodeLanguage;
        llm: LLMSettings;
    }) =>
        request<{ generated: GeneratedCode }>('/generate/code', {
            ...args,
            llm: pruned(args.llm),
        }),
};
