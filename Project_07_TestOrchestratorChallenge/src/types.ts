export interface UserStory {
    key: string;
    summary: string;
    description: string;
    status: string;
    issueType: string;
    priority: string;
    assignee: string | null;
    labels: string[];
    acceptanceCriteria: string;
    url: string;
}

export interface TestCase {
    id: string;
    storyKey: string;
    title: string;
    type: string;
    priority: string;
    preconditions: string[];
    steps: string[];
    expectedResult: string;
    testData?: string;
    status: string;
}

export interface TestPlan {
    storyKeys: string[];
    markdown: string;
    generatedAt: string;
    model: string;
}

export type Framework = 'playwright' | 'selenium';
export type CodeLanguage = 'typescript' | 'javascript' | 'java' | 'python' | 'csharp';

export interface GeneratedCode {
    testCaseId: string;
    framework: Framework;
    language: CodeLanguage;
    code: string;
    generatedAt: string;
    model: string;
}

export interface LLMSettings {
    provider: string;
    model: string;
    /** Optional per-session override; blank means "use the server's .env key". */
    apiKey: string;
}

export interface JiraSettings {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
}

export interface ServerConfig {
    jira: {
        baseUrl: string;
        email: string;
        projectKey: string;
        hasToken: boolean;
    };
    llm: {
        provider: string;
        model: string;
        configured: Record<string, boolean>;
    };
}

export type ViewId =
    | 'settings'
    | 'stories'
    | 'testPlan'
    | 'testCases'
    | 'dashboard'
    | 'codeGenerator';
