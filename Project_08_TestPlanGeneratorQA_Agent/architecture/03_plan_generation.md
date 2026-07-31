# SOP 03 — Plan generation

**Goal:** produce a template-conformant test plan whose every statement traces
back to the work item.

**Owner:** `tools/plan/{analyze,cases,render,review}.ts`, `server/agent/pipeline.ts`
**Law:** `gemini.md` invariants 1, 3, 6, 7, 8.

---

## The division of labour

| | Does | Never does |
| --- | --- | --- |
| **P1 / P2 / P3** (LLM) | judgement: what matters, what is risky, what to test | choose section order, assign IDs, format markdown |
| **`render.ts`** (code) | the document: headings, tables, ordering, placeholder fill | judgement of any kind |

If a rendering bug appears, it is a code bug with a unit test. If plan *content* is
weak, it is a prompt problem. Keeping these separable is the whole point.

## S4 — Analyze (P1)

- Prompt: `WORKFLOW.md` §3.3 P1. Output validated against `PlanAnalysis`.
- `temperature 0.15`, `max_tokens 2500`, JSON mode where the provider supports it.
- **Validation, not trust.** Unknown enum value → coerce to the nearest legal
  value and record it; missing required field → one retry with the validation
  error appended to the prompt; still bad → fail with the raw response shown. We
  never quietly ship a half-parsed analysis.
- Empty arrays are legal answers for `environments.*` and trigger fallbacks below.

## S5 — Derive cases (P2)

- Prompt: `WORKFLOW.md` §3.3 P2. IDs stripped from the response and reassigned by
  `tools/util/ids.ts` as `<WORK_ITEM_KEY>-TC-001`, sequential per work item
  (invariant 7).
- `temperature 0.2`, `max_tokens 4000`.
- Coverage check in code, not in the prompt: for each `acceptanceCriteria[i]`,
  assert at least one case references it. Any criterion with no case is appended
  to `OPEN_QUESTIONS` as *"No test case was derived for AC-3 — review needed."*
  Reporting the gap is mandatory; silently having fewer cases is not acceptable.
- `status` initialised to `'Draft'` for every case.

## S6 — Render (deterministic, no LLM)

1. Load the template, extract every `{{PLACEHOLDER}}`.
2. Reject unknown placeholders against the §2.8 contract → save-time error.
3. Fill from `PlanAnalysis`, `TestCase[]`, `WorkItem[]`, and the user's meta
   fields.
4. Apply fallbacks for empty values (below).
5. **Assert zero remaining `{{...}}`.** Any survivor is a hard error listing each
   one (invariant 6).
6. Return `{ markdown, report }` where `report = { defaulted: string[], empty: string[], placeholders: number }`.

### Formatters

| Shape | Rendered as |
| --- | --- |
| `string[]` | `- item` bullet list |
| `FeatureRow[]` | table: Story · Feature · Risk · Priority · Rationale |
| `RiskRow[]` | table: Risk · Impact · Likelihood · Mitigation |
| `schedule[]` | table: Task · Duration · Owner |
| `entryExitCriteria[]` | `### <phase>` + **Entry** / **Exit** bullet lists |
| `tools[]` | `- **Name** — purpose` |
| `TestCase[]` summary | "18 cases across 4 features: 9 positive, 5 negative, 3 boundary, 1 security" |
| `TestCase[]` table | ID · Title · Type · Priority · AC ref · Automatable |
| `TestCase[]` detail | one `### ID — Title` block: preconditions, numbered steps, expected result, test data, gaps |
| coverage matrix | table: AC · covered by (case ids) · verdict ✅ / ⚠ gap |

Empty list → the literal `_None identified._`, never a blank line. A blank section
reads as an oversight; an explicit "none" reads as an answer.

### Fallbacks

Used when P1 returns empty for a boilerplate slot. Every use is recorded in
`report.defaulted` and shown in the UI, so a reviewer knows this content came from
the template rather than the ticket.

| Placeholder | Default |
| --- | --- |
| `OPERATING_SYSTEMS` | Windows 10, macOS, Linux |
| `BROWSERS` | Chrome, Firefox, Edge, Safari |
| `DEVICES` | Desktop, Laptop, Tablet, Smartphone |
| `NETWORK` | Wi-Fi, Cellular, Wired |
| `HARDWARE_REQUIREMENTS` | Minimum processor, memory, and storage per the standard test bench |
| `SECURITY_PROTOCOLS` | Password authentication, tokens, certificates |
| `ACCESS_PERMISSIONS` | Testers, Developers, Stakeholders, Administrators |
| `DEFECT_CRITERIA` | Deviation from requirements; user-experience issues; technical errors or crashes |
| `DEFECT_TRACKING_TOOL` | the source connection (Jira / Azure DevOps / X-Ray) |
| `COMMUNICATION_CHANNELS` | Daily stand-ups, status emails, project dashboards |
| `DEFECT_METRICS` | Defects found, time to resolve, percentage fixed |
| `TEST_TECHNIQUES` | Equivalence Class Partitioning, Boundary Value Analysis, Decision Table, State Transition, Use Case Testing |
| `DELIVERABLES` | Test Plan, Test Scenarios, Test Cases, Defect Reports, Execution Reports, Summary Report |
| `TEAM_ROLES` | Test Lead, Testers, Developers, Stakeholders |
| `EVALUATION_CRITERIA` | Defects found, time to complete testing, user-satisfaction ratings |
| `TOOLS` | the source connection + Playwright + Microsoft Excel |

### Required placeholders — hard error when empty

Only three: **`PRODUCT_NAME`**, **`FEATURES`**, **`TEST_OBJECTIVES`**. These are the
substance of the plan; empty means generation failed, and the correct response is
an error rather than a document full of platitudes.

*Amended during implementation.* The list was originally longer, including
`EXCLUSIONS`, `RISK_TABLE`, and `TARGET_AUDIENCE`. Narrowed because an empty
exclusions or risk list is genuinely plausible for a small ticket, and failing a
whole run over it would punish the user for the ticket's brevity. Those now render
as `_None identified._` and are listed in `report.empty`, which is visible in the
UI — a reported absence, not a hidden one.

### Coverage gaps go into the document

`coverageGaps()` output is appended to `OPEN_QUESTIONS`, not just returned in the
render report. An acceptance criterion with no test case is precisely what §14
exists to surface, and a finding that lives only in a report nobody opens has not
been surfaced at all.

## S7 — Review (P3, optional)

The self-annealing critic. Returns findings; does not rewrite. Findings render
beside the plan with an Apply action per finding. A Blocker finding marks the plan
`needs-review` and the share buttons warn before proceeding — they do not block,
because the tester's judgement outranks the critic's.

## Token budget

Revised during implementation against measured behaviour — the original figures
were guesses and two of the three were wrong.

| Call | max_tokens | temperature | why |
| --- | --- | --- | --- |
| P1 analyze | **4000** | 0.15 | 2500 truncated the 25-field analysis right after `features` |
| P2 cases | 4000 | 0.20 | unchanged; 11 cases fit comfortably |
| P3 review | **2500** | 0.10 | 1500 truncated a multi-finding review, which Groq rejects outright |

The client sequences the calls (`findings.md` §4 — Vercel's 60s ceiling). Groq's
free tier is **8,000 tokens per minute**, not the ~12k assumed from Project_07:
per-minute 429 → honour `Retry-After`; per-day quota → fail fast, name the quota,
suggest switching model in Settings.

### Truncation must be refused, never absorbed

A reply cut off by the token cap is the most dangerous failure in this pipeline,
because the JSON prefix often still parses — so a *partial* analysis is
indistinguishable from a complete one and every field after the cut silently falls
back to a template default.

`tools/llm/client.ts` now checks each provider's own signal
(`finish_reason: 'length'`, Claude's `stop_reason: 'max_tokens'`, Gemini's
`MAX_TOKENS`, Ollama's `done_reason: 'length'`) and refuses the reply.

### The review payload is trimmed, and says so

A full plan plus its work items came to 8,446 tokens — over the per-request
ceiling, so the review could not run at all. `reviewablePlan()` drops the sections
the prompt already tells the reviewer to ignore (§5, §6, §9, §15) and, if still
over budget, the step-by-step case detail. **What was dropped is named in the
prompt and returned to the client**, because a reviewer that reports "vague steps"
for steps it never saw is worse than no reviewer.

## Edge cases

- Model returns markdown despite JSON mode → tolerant extraction of the largest
  balanced span, then validate.
- Model returns fewer cases than acceptance criteria → coverage gap in
  `OPEN_QUESTIONS`, not a retry loop.
- Work item has no acceptance criteria → generate from the description, and say so
  in Assumptions.
- Template changed after a plan was generated → the plan keeps its rendered
  markdown; **Re-render** replays S6 from the stored analysis with no LLM cost.
- Ollama cold start exceeds the request timeout → surface "the local model is
  loading, try again" rather than a bare socket error.

## Learnings

Each entry is an error that must never repeat.

**2026-07-31 — Groq rejects JSON mode unless the messages say "json".**
`response_format: {type:'json_object'}` returns HTTP 400 *"'messages' must contain
the word 'json' in some form"*. The P2 and P3 prompts described their output shape
without using the word, so both failed while P1 worked. Fixed in two places on
purpose: the prompts now say "Return ONLY a JSON object", and
`ensureJsonMentioned()` in the client appends the sentence if a future prompt edit
drops it. A provider requirement belongs in the client, not in prose discipline.

**2026-07-31 — a truncated analysis looked like a thin one.**
With `max_tokens: 2500` the model returned 3 features, 0 exclusions, 0 risks and
0 open questions, and the plan rendered with 15 sections on template defaults. It
read like a weak model. It was a cut-off response. At 4000 the same story and the
same model produced 8 features, 3 exclusions, 4 risks, 5 open questions and 10
defaults. **Before blaming model quality, check whether the reply was complete.**

**2026-07-31 — Groq's free-tier ceiling is 8,000 TPM, per request as well as per
minute.** A 24.5k-character plan sent for review was 8,446 tokens and returned 413
*"Request too large"* — not a rate limit that waiting would clear. Trimming the
boilerplate sections brought it inside the budget. Sending content the prompt
already says to ignore is not harmless; it is what made the feature impossible.

**2026-07-31 — Groq reports a truncated JSON-mode reply as a 400, not a length
signal.** *"Failed to validate JSON. Please adjust your prompt."* The advice is
useless to a user who cannot see the prompt, so `fail()` translates it into
"the reply ran past its token limit — try fewer work items or a model with more
room."

**2026-07-31 — the adversarial reviewer earns its cost.** On a plan with zero
mechanical coverage gaps (every AC had a case), it found a Blocker: AC-6 requires
a 15-minute lockout, and while a case checked the lockout *message*, none verified
the account *unlocks* afterwards. AC-to-case mapping cannot catch a partially
covered criterion; a reader can.
