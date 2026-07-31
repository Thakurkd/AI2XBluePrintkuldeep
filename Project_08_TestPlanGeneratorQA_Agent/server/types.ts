/**
 * The frozen schemas from gemini.md §2. Changing a shape here is an amendment to
 * the constitution, not a refactor.
 */

/**
 * Only Jira is implemented in v1 (gemini.md §0 Q2). Kept as a union of one on
 * purpose: when ADO or X-Ray lands, widening this line makes the compiler point
 * at every place that needs to handle it.
 */
export type ConnectionKind = 'jira';

export interface JiraAuth {
    type: 'basic';
    email: string;
    apiToken: string;
}

export interface JiraConfig {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey?: string;
    /** Custom field holding acceptance criteria, if this site has one. */
    acField?: string;
}

export type LLMProvider = 'groq' | 'xai' | 'openai' | 'claude' | 'gemini' | 'ollama';

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    endpoint?: string;
}

// --- Input ------------------------------------------------------------------

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
    /** Where the criteria came from, so the UI can be honest about it. */
    criteriaSource: 'field' | 'description' | 'none';
    links: WorkItemLink[];
    url: string;
    fetchedAt: string;
}

// --- Analysis (P1) ----------------------------------------------------------

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

export interface PlanEnvironments {
    operatingSystems: string[];
    browsers: string[];
    devices: string[];
    network: string[];
    hardwareRequirements: string[];
    securityProtocols: string[];
    accessPermissions: string[];
    baseUrl: string;
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
    environments: PlanEnvironments;
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

// --- Cases (P2) -------------------------------------------------------------

export type TestCaseType =
    | 'Positive'
    | 'Negative'
    | 'Boundary'
    | 'Security'
    | 'Accessibility'
    | 'Performance'
    | 'Usability';

export type TestCaseStatus = 'Draft' | 'Ready' | 'InProgress' | 'Passed' | 'Failed' | 'Blocked' | 'Skipped';

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

// --- Review (P3) ------------------------------------------------------------

export interface ReviewFinding {
    section: string;
    severity: 'Blocker' | 'Major' | 'Minor';
    issue: string;
    evidence: string;
    fix: string;
}

// --- Output -----------------------------------------------------------------

export interface PlanMeta {
    author: string;
    version: string;
    environment: string;
    browser: string;
    baseUrl: string;
}

export interface RenderReport {
    /** Placeholders filled from a documented default because P1 was silent. */
    defaulted: string[];
    /** Placeholders rendered as "_None identified._". */
    empty: string[];
    placeholders: number;
    /** Acceptance criteria with no test case — surfaced, never swallowed. */
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
