/** Mirrors server/types.ts. Kept as a copy so the frontend has no server import. */

export type ConnectionKind = 'jira';
export type LLMProvider = 'groq' | 'xai' | 'openai' | 'claude' | 'gemini' | 'ollama';

export interface JiraSettings {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
}

export interface LLMSettings {
    provider: LLMProvider;
    model: string;
    apiKey: string;
}

export interface ServerConfig {
    jira: { baseUrl: string; email: string; projectKey: string; hasToken: boolean; acField: string };
    llm: {
        provider: string;
        model: string;
        providers: LLMProvider[];
        localOnly: LLMProvider[];
        configured: Record<string, boolean>;
    };
    deployment: { serverless: boolean };
}

export interface JiraIdentity {
    ok: true;
    displayName: string;
    email: string;
    accountId: string;
    baseUrl: string;
    projects: { key: string; name: string }[];
}

export interface WorkItemLink {
    type: 'parent' | 'child' | 'subtask' | 'blocks' | 'blocked-by' | 'relates' | 'epic';
    key: string;
    title: string;
}

export interface WorkItem {
    id: string;
    key: string;
    source: ConnectionKind;
    title: string;
    type: string;
    status: string;
    priority: string;
    assignee: string | null;
    reporter: string | null;
    labels: string[];
    components: string[];
    description: string;
    acceptanceCriteria: string[];
    criteriaSource: 'field' | 'description' | 'none';
    links: WorkItemLink[];
    url: string;
    fetchedAt: string;
}

export interface FeatureRow {
    workItemKey: string;
    feature: string;
    riskLevel: 'H' | 'M' | 'L';
    priority: 'High' | 'Medium' | 'Low';
    rationale: string;
}

export interface RiskRow {
    risk: string;
    impact: 'High' | 'Medium' | 'Low';
    likelihood: 'High' | 'Medium' | 'Low';
    mitigation: string;
}

export interface PlanAnalysis {
    productName: string;
    targetAudience: string;
    objectiveDetail: string;
    testObjectives: string[];
    introduction: string;
    features: FeatureRow[];
    testingTypes: string[];
    evaluationCriteria: string[];
    teamRoles: { role: string; responsibility: string }[];
    exclusions: { item: string; basis: 'stated' | 'inferred' }[];
    environments: {
        operatingSystems: string[];
        browsers: string[];
        devices: string[];
        network: string[];
        hardwareRequirements: string[];
        securityProtocols: string[];
        accessPermissions: string[];
        baseUrl: string;
    };
    defectCriteria: string[];
    defectTrackingTool: string;
    communicationChannels: string[];
    defectMetrics: string[];
    testTechniques: string[];
    smokeScope: string;
    e2eFlows: string[];
    schedule: { task: string; duration: string; owner: string }[];
    timeline: string;
    deliverables: string[];
    entryExitCriteria: { phase: string; entry: string[]; exit: string[] }[];
    tools: { name: string; purpose: string }[];
    risks: RiskRow[];
    assumptions: string[];
    openQuestions: string[];
}

export type TestCaseType =
    | 'Positive'
    | 'Negative'
    | 'Boundary'
    | 'Security'
    | 'Accessibility'
    | 'Performance'
    | 'Usability';

export type TestCaseStatus = 'Draft' | 'Ready' | 'InProgress' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped';

export const TEST_CASE_STATUSES: TestCaseStatus[] = [
    'Draft',
    'Ready',
    'InProgress',
    'Passed',
    'Failed',
    'Blocked',
    'Skipped',
];

export interface TestCase {
    id: string;
    workItemKey: string;
    acceptanceCriterionRef: string | null;
    title: string;
    type: TestCaseType;
    priority: 'High' | 'Medium' | 'Low';
    preconditions: string[];
    steps: string[];
    expectedResult: string;
    testData: string;
    automatable: boolean;
    gaps: string[];
    status: TestCaseStatus;
}

export interface ReviewFinding {
    section: string;
    severity: 'Blocker' | 'Major' | 'Minor';
    issue: string;
    evidence: string;
    fix: string;
}

export interface PlanMeta {
    author: string;
    version: string;
    environment: string;
    browser: string;
    baseUrl: string;
}

export interface RenderReport {
    defaulted: string[];
    empty: string[];
    placeholders: number;
    coverageGaps: string[];
}

export interface ShareRecord {
    target: 'jira-comment' | 'jira-attachment' | 'file';
    ref: string;
    at: string;
}

export interface TestPlan {
    id: string;
    workItemKeys: string[];
    templateId: string;
    fidelity: 'strict' | 'enriched';
    meta: PlanMeta;
    additionalContext: string;
    workItems: WorkItem[];
    analysis: PlanAnalysis;
    testCases: TestCase[];
    markdown: string;
    report: RenderReport;
    review?: ReviewFinding[];
    model: { provider: string; model: string };
    createdAt: string;
    updatedAt: string;
    shares: ShareRecord[];
}

export interface Template {
    id: string;
    name: string;
    body: string;
    builtIn: boolean;
    updatedAt: string;
}
