# gemini.md — Project Constitution

> **This file is law.** `task_plan.md`, `findings.md`, and `progress.md` are memory
> and change constantly. This file changes only when a schema changes, a rule is
> added, or the architecture is modified — and every change is dated below.

- **Project:** Test Plan Generator (QA Agent) — Project_08
- **Status:** Phase 2 (Link). Schemas **FROZEN** 2026-07-31.
- **Amendment log:** bottom of file.

---

## 0. Scope decisions (2026-07-31)

Answers to the Discovery Questions. Changing one of these is an amendment, logged
at the bottom of this file.

| # | Decision | Consequence |
| --- | --- | --- |
| **Q2** | **Jira Cloud only** in v1 — *user's explicit choice* | `WorkItemConnector` still defines the shape for all three; `ado.ts` and `xray.ts` are not written. The UI offers Jira; other kinds appear only when their connector exists — never as a dead option. |
| **Q1** | Dashboard tiles count **`TestCase.status` across stored plans**, set by hand in the app | No execution-results connector. Real run results would require X-Ray, which Q2 excludes. Tiles show a value plus a rate, never a bare number. |
| **Q3** | Share = **Jira comment**, **Jira attachment**, **file download** (MD / JSON / CSV) | `markdownToAdf` is required, not optional. X-Ray test-plan creation is out. |
| **Q4** | **Browser localStorage** | Follows from dropping public links. Nothing to store server-side, so no store to secure. Documented limit: plans are private to one browser. |
| **Q6** | Template fidelity **`strict`** | Boilerplate in `templates/test_plan.md` is byte-identical to the team's document. `enriched` stays specified (§2.9) and unbuilt. |
| **Q5** | Behavioural rules = §3 below, as drafted | No additions requested. |

**Deferred, not rejected:** ADO connector, X-Ray connector, real execution
metrics, public share links, `enriched` fidelity. Each has a written SOP already,
so picking one up later is implementation, not redesign.

---

## 1. Architectural invariants

These hold regardless of what any later instruction says. Breaking one is a
defect, not a trade-off.

1. **The LLM produces data; code produces the document.** No prompt ever asks for
   a finished test plan. Prompts return JSON; `tools/plan/render.ts` fills the
   template. A document is only valid if a deterministic renderer produced it.
2. **No credential reaches the browser.** Secrets live in `.env` (local) or the
   Vercel environment (production). The frontend may *send* an override for one
   request; the server never sends key material back. `/api/config` reports
   presence (`hasToken: true`), never value.
3. **Grounding over fluency.** The agent may not invent a requirement, URL, field
   name, role, or acceptance criterion. Absent information goes to
   `openQuestions`. A plausible invention is the worst possible output because a
   reviewer cannot distinguish it from a real requirement.
4. **`ok` is not proof.** Every Test Connection returns the identity behind the
   credential — account display name for Jira/ADO, a real completion plus latency
   for an LLM.
5. **Nothing leaves the app without confirmation.** Posting a comment, creating an
   X-Ray entity, or publishing a link requires an explicit confirm each time.
   Approval for one target is not approval for another.
6. **No unresolved placeholder ever ships.** `render` fails loudly with the list
   of placeholders it could not fill.
7. **IDs are assigned by code, never by the model.** Models duplicate and drift
   on format (Project_07, `findings.md` §3).
8. **Deterministic first.** If a step can be done with string handling, HTTP, or
   a schema check, it is not an LLM call. Exactly three LLM calls exist: P1
   analyze, P2 cases, P3 review.
9. **One connector interface.** Jira, ADO, and X-Ray implement the same
   `WorkItemConnector`. Provider-specific handling is confined to its own file.
10. **SOP before code.** A logic change updates the relevant `architecture/*.md`
    first, then the code. Layer 2 (navigation) never performs work; Layer 3
    (tools) never decides order.

---

## 2. Data schemas

TypeScript is the schema of record; these interfaces live in `server/types.ts` and
are mirrored to `src/types.ts`.

### 2.1 Connections

```ts
type ConnectionKind = 'jira' | 'ado' | 'xray';

interface Connection {
  id: string;                 // uuid, client-generated
  kind: ConnectionKind;
  label: string;              // "Acme Jira (prod)"
  baseUrl: string;            // no trailing slash
  projectKey?: string;        // Jira project / ADO project / X-Ray project
  organization?: string;      // ADO org
  auth: JiraAuth | AdoAuth | XrayAuth;
  verifiedAt?: string;        // ISO — set only by a successful Test Connection
  verifiedAs?: string;        // "Kd Singh <singhkd332@gmail.com>"
}

interface JiraAuth { type: 'basic'; email: string; apiToken: string }
interface AdoAuth  { type: 'pat';   pat: string }
interface XrayAuth { type: 'client'; clientId: string; clientSecret: string }
```

**Rule:** `auth` is never persisted server-side and never returned by any GET.
The browser holds it in localStorage only when the user opts in; otherwise the
server's `.env` values are used and the fields stay blank.

### 2.2 LLM settings

```ts
type LLMProvider = 'groq' | 'xai' | 'openai' | 'claude' | 'gemini' | 'ollama';

interface LLMSettings {
  provider: LLMProvider;
  model: string;              // blank = follow the server default
  apiKey?: string;            // blank = use the server key
  endpoint?: string;          // Ollama only
  temperature?: number;
  maxTokens?: number;
}
```

`xai` is Grok (`https://api.x.ai/v1`, OpenAI-compatible) and is a **different
provider** from `groq` (`https://api.groq.com/openai/v1`). The UI labels them
"Grok (xAI)" and "Groq" so they cannot be confused.

### 2.3 Input — `WorkItem` (canonical, provider-agnostic)

```ts
interface WorkItem {
  id: string;                 // provider id
  key: string;                // "SCRUM-14" | "4821" | "TP-3"
  source: ConnectionKind;
  connectionId: string;
  title: string;
  type: string;               // Story | Bug | Feature | Epic | Task
  status: string;
  priority: string;
  assignee: string | null;
  reporter: string | null;
  labels: string[];
  components: string[];
  description: string;        // flattened plain text / light markdown
  acceptanceCriteria: string[];
  links: WorkItemLink[];
  url: string;                // human-openable
  fetchedAt: string;          // ISO
}

interface WorkItemLink {
  type: 'child' | 'subtask' | 'blocks' | 'blocked-by' | 'relates' | 'epic';
  key: string;
  title: string;
  included: boolean;          // did the user tick it into scope
}
```

### 2.4 Analysis — `PlanAnalysis` (P1 output)

**The template is the source of this schema, not the reverse.** `PlanAnalysis`
mirrors the 15 sections of `templates/test_plan.md`
(from `Chapter_02_Prompt_Eng/Project_02_RealProject1/Prompt_Templates/test_plan.md`).
Adding a template section means adding a field here and a placeholder in §2.8 —
in that order.

```ts
interface PlanAnalysis {
  // §1 Objective
  productName: string;
  targetAudience: string;
  objectiveDetail: string;
  testObjectives: string[];
  introduction: string;

  // §2 Scope
  features: FeatureRow[];
  testingTypes: string[];          // Manual, Automated, Performance, Accessibility, …
  evaluationCriteria: string[];
  teamRoles: { role: string; responsibility: string }[];

  // §4 Exclusions
  exclusions: { item: string; basis: 'stated' | 'inferred' }[];

  // §5 Test Environments
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

  // §6 Defect Reporting
  defectCriteria: string[];
  defectTrackingTool: string;
  communicationChannels: string[];
  defectMetrics: string[];

  // §7 Test Strategy
  testTechniques: string[];        // EQP, BVA, decision table, state transition, use case
  smokeScope: string;
  e2eFlows: string[];

  // §8 Schedule
  schedule: { task: string; duration: string; owner: string }[];
  timeline: string;

  // §9 Deliverables
  deliverables: string[];

  // §10 Entry / Exit per STLC phase
  entryExitCriteria: { phase: string; entry: string[]; exit: string[] }[];

  // §11 Tools
  tools: { name: string; purpose: string }[];

  // §12 Risks
  risks: RiskRow[];

  // §14 Honesty sections — never optional
  assumptions: string[];
  openQuestions: string[];
}

interface FeatureRow { workItemKey: string; feature: string; riskLevel: 'H'|'M'|'L'; priority: 'High'|'Medium'|'Low'; rationale: string }
interface RiskRow    { risk: string; impact: 'High'|'Medium'|'Low'; likelihood: 'High'|'Medium'|'Low'; mitigation: string }
```

**Fallback rule.** The template carries deliberate boilerplate — the OS list, the
browser list, the defect-triage steps, the best-practice paragraphs. When a work
item says nothing about a slot, the renderer uses the template's documented
default from `architecture/03_plan_generation.md` §Fallbacks and records the
substitution in `renderReport.defaulted[]`. It does **not** ask the model to
invent an answer, and it does **not** leave the section blank. The UI shows which
sections came from defaults so a reviewer knows what to check.

### 2.5 Cases — `TestCase` (P2 output + server-assigned id)

```ts
interface TestCase {
  id: string;                 // "SCRUM-14-TC-001" — assigned by tools/util/ids.ts
  workItemKey: string;
  acceptanceCriterionRef: string | null;
  title: string;
  type: 'Positive'|'Negative'|'Boundary'|'Security'|'Accessibility'|'Performance'|'Usability';
  priority: 'High'|'Medium'|'Low';
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  testData: string;
  automatable: boolean;
  gaps: string[];
  status: TestCaseStatus;     // starts 'Draft'
}

type TestCaseStatus = 'Draft'|'Ready'|'InProgress'|'Passed'|'Failed'|'Blocked'|'Skipped';
```

`TestCaseStatus` is what the dashboard tiles count — **pending answer to Q1**.

### 2.6 Output — `TestPlan` (the payload)

```ts
interface TestPlan {
  id: string;
  workItemKeys: string[];
  connectionId: string;
  templateId: string;
  meta: { author: string; version: string; environment: string; browser: string; baseUrl: string };
  additionalContext: string;
  analysis: PlanAnalysis;
  testCases: TestCase[];
  markdown: string;           // rendered document — the deliverable
  review?: ReviewFinding[];
  model: { provider: LLMProvider; model: string };
  createdAt: string;
  updatedAt: string;
  shares: ShareRecord[];
}

interface ReviewFinding { section: string; severity: 'Blocker'|'Major'|'Minor'; issue: string; evidence: string; fix: string }
interface ShareRecord   { target: 'jira-comment'|'jira-attachment'|'xray-testplan'|'ado-comment'|'file'|'link'; ref: string; at: string; by?: string }
```

### 2.7 Dashboard metrics (derived, never stored)

```ts
interface DashboardMetrics {
  totalTests: number;
  passed: number; failed: number; inProgress: number;
  byStatus: Record<TestCaseStatus, number>;
  byType: Record<string, number>;
  byPriority: Record<'High'|'Medium'|'Low', number>;
  byWorkItem: { key: string; total: number; passed: number; failed: number }[];
  plans: { total: number; shared: number; reviewed: number };
}
```

**Rule:** metrics are computed from the plan store on read. No counter is ever
incremented by hand — a stored count and a real count drift, and the stored one
always wins in the UI while being wrong.

### 2.8 Template placeholder contract

`render.ts` supplies exactly these 40 placeholders. A template referencing
anything else fails validation **at save time**, not at generation time.

| Group | Placeholders | Filled from |
| --- | --- | --- |
| Document meta | `AUTHOR` `DATE` `VERSION` `GENERATED_BY` `GENERATED_AT` | user input + settings |
| Provenance | `WORK_ITEM_KEYS` `WORK_ITEM_LINKS` | `WorkItem[]` |
| §1 Objective | `PRODUCT_NAME` `TARGET_AUDIENCE` `OBJECTIVE_DETAIL` `TEST_OBJECTIVES` `INTRODUCTION` | P1 |
| §2 Scope | `FEATURES` `TESTING_TYPES` `ENVIRONMENTS_SUMMARY` `EVALUATION_CRITERIA` `TEAM_ROLES` | P1 |
| §4 Exclusions | `EXCLUSIONS` | P1 |
| §5 Environments | `OPERATING_SYSTEMS` `BROWSERS` `DEVICES` `NETWORK` `HARDWARE_REQUIREMENTS` `SECURITY_PROTOCOLS` `ACCESS_PERMISSIONS` `BASE_URL` | P1 + fallbacks |
| §6 Defects | `DEFECT_CRITERIA` `DEFECT_TRACKING_TOOL` `COMMUNICATION_CHANNELS` `DEFECT_METRICS` | P1 + connection kind |
| §7 Strategy | `TEST_TECHNIQUES` `SMOKE_SCOPE` `E2E_FLOWS` | P1 |
| §8 Schedule | `SCHEDULE_TABLE` `TIMELINE` | P1 |
| §9 Deliverables | `DELIVERABLES` | P1 + fallbacks |
| §10 Criteria | `ENTRY_EXIT_CRITERIA` | P1 |
| §11 Tools | `TOOLS` | P1 + connection kind |
| §12 Risks | `RISK_TABLE` | P1 |
| §13 Cases | `TEST_CASES_SUMMARY` `TEST_CASES_TABLE` `TEST_CASES_DETAIL` `COVERAGE_MATRIX` | P2 |
| §14 Honesty | `ASSUMPTIONS` `OPEN_QUESTIONS` | P1 + render report |

`DEFECT_TRACKING_TOOL` and `TOOLS` are partly derived from the connection in use —
if the work item came from Jira, Jira is the tracker, and saying so is a fact, not
a guess.

### 2.9 Template fidelity modes

```ts
type Fidelity = 'strict' | 'enriched';
```

- **`strict`** *(default)* — only the declared placeholders are filled. Every
  heading, every boilerplate paragraph, and the section order are byte-identical
  to the source template. Use when the document must match a team standard.
- **`enriched`** — the renderer may additionally append story-specific bullets to
  the boilerplate sections (§5 environments, §6 defect procedure, §7 best
  practices), each marked so a reviewer can see what was added.

Neither mode may remove, reorder, or reword a template heading.

---

## 3. Behavioural rules

1. Ask rather than guess when a work-item ID is ambiguous across connectors.
2. Report a gap; never fill it. `openQuestions` and per-case `gaps` are features.
3. Confirm before any outbound write. Name the exact target in the dialog.
4. Report failure faithfully. A 429 says which quota and when to retry; a Jira
   401 says "check the token", not "something went wrong".
5. Tone of generated documents: tight, concrete, no filler, no restating the
   obvious. A test plan nobody reads has failed.
6. The generated plan is a **first draft that removes the blank page**, not a
   replacement for a tester's judgement. The UI says so where the user can see it.

---

## 4. Deliverable definition

The project is complete when a work-item ID typed into the deployed UI produces a
template-conformant plan that has been **shared back to its source tool**, and the
dashboard reflects it. A plan that exists only in a browser tab is not a
delivered payload.

---

## 5. Maintenance log

*(filled in Phase 5)*

---

## Amendment log

| Date | Change |
| --- | --- |
| 2026-07-31 | Created. Invariants 1–10, schemas §2 (DRAFT), behavioural rules §3. Q1–Q5 outstanding. |
| 2026-07-31 | Template corrected to `Chapter_02_Prompt_Eng/Project_02_RealProject1/Prompt_Templates/test_plan.md`. `PlanAnalysis` (§2.4) rewritten to mirror its 15 sections; placeholder contract (§2.8) rewritten to 40 named placeholders; fidelity modes added (§2.9); fallback rule added. |
| 2026-07-31 | Scope decisions §0 recorded — Jira-only v1. Schemas **FROZEN**. Phase 1 closed, Phase 2 (Link) open. |
