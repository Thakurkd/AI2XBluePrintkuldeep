# progress.md — what was done, errors, tests, results

Newest first. One entry per meaningful task.

---

## 2026-07-31 — three defects found by the user's first click-through

The user ran the app and hit a failed **Deriving test cases** step. Diagnosed and
fixed all three causes; the flow now completes in the browser.

**1. The error was invisible.** A red ✕ sat next to the failed step while the
reason was in a banner at the top of the page, scrolled out of view. The user saw a
failure with no cause — the worst possible error state. The reason now renders
inside the Generate panel, next to the step that failed, with a note that earlier
steps are kept.

**2. The retry cap was too conservative.** Groq refused the cases call with
*"try again in 27.21s"* — a per-minute window, exactly the kind the client is
supposed to wait out — but `MAX_RETRY_WAIT_MS` was 15s, so it gave up. The caps are
now environment-aware: **35s locally**, **12s on serverless**, where sleeping that
long risks the platform's 60s kill and "retry from here" is the better answer.

**3. The cases cap was too small.** With the rate limit absorbed, the next honest
failure appeared: 8 acceptance criteria produce 11+ fully specified cases, past the
4000-token limit. Raised to 5000 — the practical ceiling on this tier, since the
prompt is ~2,500 tokens and one request may not exceed 8,000 — plus conciseness
rules in P2 and a documented 14-case ceiling the model must report rather than
silently exceed.

**Verified in a real browser, clean workspace, as a user would:**

```
type SCRUM-5 → Fetch      → work item card, 8 acceptance criteria
Generate plan             → PLAN OPENED in 36.6s, 10 test cases
                             0 page errors
```

Both earlier failures were reproduced first and fixed in that order, so each fix is
attributable. `findings.md` §12 items 7–9 and the free-tier arithmetic.

**Note on model quality, not a defect:** the model assigns every feature the
story's own priority (all Medium here) even where it calls the risk High. Its
rationale says so explicitly — "story priority is Medium" — so it is reasoning, not
drifting. Worth a prompt experiment later; not worth code.

---

## 2026-07-31 — Phase 3 Architect + Phase 4 Stylize complete; verified end to end

**Decision carried over:** LLM layer reused from Project_07 as the user asked —
`resolveLLMConfig` keeps model choice on the server with per-request overrides,
plus the rate-limit retry that waits out per-minute limits and fails fast on daily
quotas. Extended with xAI (Grok) as a sixth provider.

**Built — backend**

| File | Role |
| --- | --- |
| `server/types.ts` | the frozen schemas; `ConnectionKind` is a union of one so widening it makes the compiler find every site |
| `server/config.ts` | `.env` + per-request overrides, never returns key material |
| `server/prompts.ts` | P0 grounding, P1 analyze, P2 cases, P3 review |
| `server/app.ts` · `server/server.ts` · `api/index.ts` | Express 5, password gate, serverless wrapper |
| `server/routes/` | connections, llm, plan, share |
| `tools/llm/client.ts` | six providers, rate-limit retry, JSON mode, truncation refusal |
| `tools/llm/models.ts` | live model lists, non-chat filter, model Test Connection |
| `tools/connectors/jira.ts` | verify, id parsing, fetch, depth-1 links |
| `tools/plan/{analyze,cases,render,review}.ts` | the four pipeline steps |
| `tools/share/{jira,markdownToAdf}.ts` | summary comment + attachment |
| `tools/util/{adf,criteria,ids}.ts` | the deterministic core |

**Built — frontend.** Six views plus the plan viewer, one persisted store,
password gate. `src/metrics.ts` (moved out of `tools/` — plans live in the browser,
so the server never sees the corpus). `StatusBarChart.tsx` is inline SVG with no
chart dependency.

**Chart colour was computed, not chosen.** Test-case statuses are *states*, so the
status palette applies rather than a categorical one. The validator reported
Passed↔Failed at **ΔE 4.1 under deuteranopia** — a red/green pair a deuteranope
cannot separate. Hue therefore carries none of the meaning: every bar has a text
label, a distinct shape glyph, a value at its tip, and a table-view twin.

**Verified — measured, not asserted**

```
60 unit tests passing (adf 11, criteria 10, ids 10, markdownToAdf 12, render 17)
typecheck clean, both configs
vite build: 396 kB js / 11.5 kB css, 705 ms
e2e against live Jira + live Groq:
  SCRUM-5 → 11 cases → 24,585-char plan in 31.9s
  8 acceptance criteria, all covered · 0 mechanical coverage gaps
  45 placeholders filled · 0 unresolved · 14/14 sections present
  review: 2 findings, one Blocker
9 views screenshotted in a real browser, 0 React errors
```

**Six defects found by running it** — full table in `findings.md` §12, learnings in
`architecture/03_plan_generation.md`. The one that mattered most: `max_tokens:
2500` was silently truncating the analysis, and the result looked like a weak model
rather than a cut-off response. Raising it to 4000 took the same story from 3
features / 0 risks / 0 open questions to 8 / 4 / 5. The client now refuses a
truncated reply outright.

**Errors outstanding**

One 404 in the browser console: a missing favicon. Cosmetic, not wired to anything.

**Next**

Phase 5 Trigger: README and PROJECT.md, then deploy to Vercel behind
`APP_PASSWORD`. Not yet exercised against a live ticket: the Jira **share** path
(comment + attachment) — the preview renders correctly and `markdownToAdf` has 12
tests, but nothing has been posted to a real issue, because that writes to a ticket
other people can see and needs the user's go-ahead.

---

## 2026-07-31 — Phase 2 Link complete, every wire green

**Scope decided.** User's answer: **Jira integration only for now.** The remaining
Discovery questions were taken as documented defaults and recorded in `gemini.md`
§0 — in-app case-status metrics (real execution results would need X-Ray, which
Jira-only excludes), share via Jira comment + attachment + file download,
localStorage persistence, `strict` template fidelity. Schemas **FROZEN**.

**Built**

- `package.json`, `tsconfig.json`, `tsconfig.server.json`. 253 packages installed.
  Port 5008 so this runs alongside Project_07 on 5007.
- `tools/link/_env.ts` — shared handshake plumbing. Deliberately does not import
  the app's config layer: a handshake that depends on the code it validates proves
  nothing.
- `tools/link/{jira,jira-issue,llm,models}.ts` — four runnable handshakes,
  `npm run link:all`.
- `tools/util/adf.ts` — ADF → text. Headings, nested lists, tables with a real
  separator row, code blocks, marks, attachments named rather than dropped.
- `tools/util/criteria.ts` — flattened text → `string[]` of criteria. Handles
  bulleted, numbered, Gherkin, and prose forms; stops at the next section heading.

Both utils are Phase 3 task 3.2, built early because the handshakes needed them to
prove anything meaningful. `tsc -p tsconfig.server.json --noEmit` clean.

**Results — all measured, none assumed** (full output in `findings.md` §11)

| Handshake | Result |
| --- | --- |
| Jira credentials | `kuldeep singh`, accountId `712020:56ec…`, 1 project visible: SCRUM (SDETSPACE) |
| AC custom field | **none on this site** → `JIRA_AC_FIELD` blank, description scraping is the only path |
| SCRUM-5 fetch | 1412 chars flattened, headings preserved, **8 acceptance criteria split correctly**, 0 linked items |
| Groq | `openai/gpt-oss-120b`, **969 ms**, 148 in / 158 out, JSON mode honoured |
| Ollama | `llama3.2:3b`, **23,640 ms**, JSON mode honoured |
| Model lists | Groq **15** live, Ollama 1, xAI/OpenAI/Claude/Gemini skipped for missing keys |

**Two findings that change the design**

1. **Ollama is ~25× slower than Groq** — 23.6s for a 200-token request. A
   4000-token P2 call on a local 3B model cannot finish inside Vercel's 60s
   ceiling, so Ollama becomes a **local-only** provider: selectable, never the
   default, and the UI must say why. This also confirms the client-sequenced
   pipeline — a single combined `/generate` endpoint would be unusable locally.
2. **Groq's model list contains non-chat models** — `whisper-large-v3`,
   `llama-prompt-guard-2-*`, `orpheus-*`. Offering them in the "Test Model"
   dropdown guarantees a baffling failure, so the list is filtered by family while
   free text stays allowed.

**One thing worth keeping**

SCRUM-5 has an "Out of Scope" section immediately after its acceptance criteria,
and the `SECTION_END` stop caught it. Without that stop, three out-of-scope items
would have become acceptance criteria and generated test cases for features that
do not exist. That is the first regression test to write in Phase 3.

**Errors**

None.

**Next — Phase 3 Architect**

1. Unit tests for `adf.ts` and `criteria.ts`, starting with the SCRUM-5
   out-of-scope case.
2. `tools/llm/client.ts` (6 providers, rate-limit retry, JSON mode) +
   `models.ts` with the non-chat filter.
3. `tools/plan/{analyze,cases,render}.ts` — P1, P2, and the deterministic renderer
   against `templates/test_plan.md`.
4. Express app, routes, then the six frontend views.

---

## 2026-07-31 — Phase 0 Initialization complete; Phase 1 open

**Done**

- Created `Project_08_TestPlanGeneratorQA_Agent/`.
- Studied `../Project_07_TestOrchestratorChallenge` in full: `PROJECT.md`,
  `package.json`, `server/config.ts`, `server/app.ts`,
  `server/services/{jira,llm}.service.ts`, `server/prompts.ts`,
  `src/components/SettingsView.tsx`, `vercel.json`, `vite.config.ts`.
  Reusable assets catalogued in `findings.md` §1.
- **Template corrected mid-session.** First searched the repo and found
  `../Project04_MCP_Connections/Templates/test_plan_template.md`; the user then
  named the real one:
  `../Chapter_02_Prompt_Eng/Project_02_RealProject1/Prompt_Templates/test_plan.md`
  — 13 sections with `<angle-bracket>` slots. Ported to
  `templates/test_plan.md` with every heading preserved, slots converted to a
  declared `{{PLACEHOLDER}}` contract, and three sections added: §13 Test Cases,
  §14 Assumptions & Open Questions, §15 Approvals (was §13).
- Consequence recorded: **the template is the source of the `PlanAnalysis`
  schema**, not the reverse. `gemini.md` §2.4 was rewritten to mirror the 15
  sections, and the P1 prompt in `WORKFLOW.md` was rewritten to request exactly
  those fields. This is the difference between a plan that fits the team's
  document and one that merely resembles a test plan.
- Added the **fallback rule**: the template's deliberate boilerplate (OS list,
  browser list, defect-triage steps, best practices) has documented defaults in
  `architecture/03_plan_generation.md`, used when the ticket is silent and
  reported in `renderReport.defaulted[]` so a reviewer sees what came from a
  default. The sections that *are* the plan — features, objectives, exclusions,
  risks, cases — have no fallback; empty means failure, not platitudes.
- Added **fidelity modes** `strict` (default, boilerplate byte-identical) and
  `enriched` (marked story-specific additions) — `gemini.md` §2.9, open as Q6.
- Wrote `WORKFLOW.md`: B.L.A.S.T. phase/task breakdown, the 9-step runtime
  pipeline, the three prompts (P1 analyze, P2 cases, P3 review) in full, token
  budgets, API surface, and screen-by-screen behaviour.
- Wrote `gemini.md`: 10 architectural invariants, draft schemas for
  `Connection`, `LLMSettings`, `WorkItem`, `PlanAnalysis`, `TestCase`, `TestPlan`,
  `DashboardMetrics`, and the template placeholder contract.
- Scaffolded `architecture/` SOPs 01–05 (Layer 1, written before any code).
- Created `.env` (gitignored) with the Jira and Groq credentials from Project_07,
  plus `.env.example` documenting every variable.

**Key decision recorded**

The model returns JSON; deterministic code renders the template. This is the
difference between Project_08 and Project_07 and the reason plan structure cannot
drift between runs. Recorded as `gemini.md` invariant 1.

**Deviation flagged for approval**

The UI sketch shows three sidebar items (Dashboard, Settings, Connections). The
plan adds **Generate**, **Plans**, and **Templates**, because the flow needs
somewhere to run and somewhere to keep results. Awaiting a yes or a collapse-back.

**Errors**

None. No code written yet — Protocol 0 halts `tools/` until the Blueprint is
approved.

**Blocked on**

Discovery Q1–Q5 in `WORKFLOW.md` §6. Q1 (what the dashboard tiles count) and Q2
(which connectors ship in v1) gate the largest amount of work: Q1 decides whether
an execution-results connector exists at all, Q2 decides whether ADO and X-Ray
handshakes happen in Phase 2 or later.

**Next**

1. Get Q1–Q5 answered, record them in `gemini.md`, freeze the schemas.
2. Phase 2 Link: Jira `/myself`, one real issue by key, Groq completion, Ollama
   completion, live model lists. No logic until every wire is green.
