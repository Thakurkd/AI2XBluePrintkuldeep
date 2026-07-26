export interface UserStory {
    key: string;              // e.g. SCRUM-12
    summary: string;
    description: string;      // flattened to plain text from Jira's ADF
    status: string;
    issueType: string;
    priority: string;
    assignee: string | null;
    labels: string[];
    acceptanceCriteria: string;
    url: string;
}

export interface TestCase {
    id: string;               // e.g. SCRUM-12-TC-001
    storyKey: string;
    title: string;
    type: string;             // Positive / Negative / Boundary / Security / ...
    priority: 'High' | 'Medium' | 'Low' | string;
    preconditions: string[];
    steps: string[];
    expectedResult: string;
    testData?: string;
    status: string;           // Draft | Ready | Automated
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
