# task_plan.md — Test Plan Generator (QA Agent)

Phases, goals, checklists. Full task detail and prompts live in
[WORKFLOW.md](WORKFLOW.md); the law lives in [gemini.md](gemini.md).

**Now:** Phase 2 — Link. Scope decided: **Jira Cloud only**, localStorage,
strict template fidelity, share via Jira comment/attachment/download
(`gemini.md` §0).

---

## Phase 0 — Initialization ✅

- [x] `task_plan.md`, `findings.md`, `progress.md` created
- [x] `gemini.md` constitution with draft schemas
- [x] Reference project studied (Project_07) → `findings.md` §1
- [x] `WORKFLOW.md` written — build workflow, prompts, runtime flow
- [x] `.env` + `.env.example` seeded from Project_07 (Jira, Groq)
- [x] `templates/test_plan_template.md` with the placeholder contract
- [x] `architecture/` SOPs scaffolded
- [x] **HALT** — no `tools/` code until the Blueprint is approved

## Phase 1 — B: Blueprint ✅

- [x] Q2 connectors — **Jira Cloud only** (user's choice)
- [x] Q1 dashboard metrics — in-app `TestCase.status` counts (X-Ray excluded by Q2)
- [x] Q3 share targets — Jira comment, Jira attachment, MD/JSON/CSV download
- [x] Q4 persistence — browser localStorage (follows from no share links)
- [x] Q6 template fidelity — `strict`
- [x] Q5 behavioural rules — as drafted in `gemini.md` §3
- [x] Schemas marked **FROZEN** in `gemini.md`
- [x] Decisions recorded in `gemini.md` §0

## Phase 2 — L: Link ✅ every wire green

- [x] `package.json`, `tsconfig.json`, `tsconfig.server.json`; 253 packages installed
- [x] `tools/link/jira.ts` → **kuldeep singh**, 1 project visible (SCRUM/SDETSPACE)
- [x] `tools/link/jira-issue.ts` → SCRUM-5, 1412 chars flattened, **8 AC split correctly**
- [x] `tools/link/llm.ts` → Groq `openai/gpt-oss-120b`, **969 ms**, JSON mode honoured
- [x] `tools/link/llm.ts --provider ollama` → `llama3.2:3b`, **23,640 ms**, JSON honoured
- [x] `tools/link/models.ts` → Groq **15 models** live, Ollama 1, four providers skipped for missing keys
- [x] AC custom field discovery → **none on this site**; `JIRA_AC_FIELD` stays blank
- [x] `tsc -p tsconfig.server.json` clean
- [x] ~~ADO~~ / ~~X-Ray~~ — deferred by Q2

**Built early because the handshakes needed them (and they are Phase 3 tasks 3.2):**
`tools/util/adf.ts`, `tools/util/criteria.ts` — both proven against real ADF.

**Two constraints discovered — see `findings.md` §11:**
1. Ollama is ~25× slower than Groq and cannot finish a plan inside Vercel's 60s
   ceiling → local-only provider, never the default, warned about in the UI.
2. Groq's model list contains non-chat models (whisper, prompt-guard) → the
   dropdown must filter them out while still allowing free text.

## Phase 3 — A: Architect ✅ · Phase 4 — S: Stylize ✅

Everything below is built and verified. See `progress.md` for the evidence block.

- [x] Scaffold: package/tsconfigs/vite/vercel, Express app, serverless wrapper
- [x] `tools/util/{adf,criteria,ids}.ts` + **43 unit tests**
- [x] `tools/llm/{client,models}.ts` — six providers, truncation refusal, live model lists
- [x] `tools/connectors/jira.ts` — verify, id parsing, fetch, depth-1 links
- [x] `tools/plan/{analyze,cases,render,review}.ts` + **17 render tests**
- [x] `tools/share/{jira,markdownToAdf}.ts` + **12 ADF tests**
- [x] `src/metrics.ts` (moved out of `tools/` — the corpus is client-side)
- [x] All routes answering locally
- [x] Six views + plan viewer + password gate, one persisted store
- [x] Dashboard chart: inline SVG, status palette **validated** (Passed↔Failed ΔE 4.1
      deutan → identity carried by label + glyph + value + table view)
- [x] 9 views screenshotted in a real browser, 0 React errors
- [x] `npm run e2e` — live Jira + live Groq, 11 cases, 24.5k-char plan, 31.9s

## Phase 5 — T: Trigger 🔵 next

- [x] `npm run typecheck` clean (both configs)
- [x] `npm test` — 60/60 passing
- [x] `npm run build` — 396 kB js, 705 ms
- [x] End-to-end evidence recorded
- [ ] `README.md` — setup, env vars, API table
- [ ] `PROJECT.md` — what was built and why
- [ ] Deploy to Vercel behind `APP_PASSWORD`
- [ ] Production smoke test
- [ ] **Share to a real Jira ticket** — needs the user's go-ahead; it writes to a
      ticket other people can see
- [ ] Maintenance log in `gemini.md`

## Phase 3 — original task list (kept for reference)

**Scaffold**
- [ ] `package.json`, `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `vercel.json`
- [ ] `server/app.ts` with the password gate + error middleware
- [ ] `api/index.ts` serverless wrapper

**Layer 3 — tools**
- [ ] `tools/util/adf.ts` + tests (nested lists, tables survive)
- [ ] `tools/util/html.ts` + tests (ADO descriptions)
- [ ] `tools/util/ids.ts` + tests (sequential per work item, no duplicates)
- [ ] `tools/connectors/jira.ts` implementing `WorkItemConnector`
- [ ] `tools/connectors/ado.ts` *(Q2)*
- [ ] `tools/connectors/xray.ts` *(Q2)*
- [ ] `tools/llm/client.ts` — 6 providers, rate-limit retry, JSON mode
- [ ] `tools/llm/models.ts` — live model list
- [ ] `tools/llm/json.ts` — tolerant JSON extraction + schema validation
- [ ] `tools/plan/analyze.ts` (P1)
- [ ] `tools/plan/cases.ts` (P2)
- [ ] `tools/plan/render.ts` + tests — **zero unresolved placeholders**
- [ ] `tools/plan/review.ts` (P3)
- [ ] `tools/util/metrics.ts` + tests
- [ ] `tools/share/jira.ts` — markdown → ADF comment, attachment upload
- [ ] `tools/share/files.ts` — MD / JSON / CSV
- [ ] `tools/share/xray.ts` *(Q3)*

**Layer 2 — navigation**
- [ ] `server/agent/pipeline.ts` — S1…S9 orchestration, step results, no work of its own

**Routes**
- [ ] `/api/health`, `/api/auth`, `/api/config`
- [ ] `/api/connections/test`
- [ ] `/api/llm/models`, `/api/llm/test`
- [ ] `/api/workitems/fetch`
- [ ] `/api/templates`
- [ ] `/api/plan/analyze`, `/cases`, `/render`, `/review`
- [ ] `/api/share/*`

**Frontend**
- [ ] `src/store.tsx` — persisted workspace
- [ ] Dashboard, Generate, Plans, Templates, Connections, Settings
- [ ] `PasswordGate`
- [ ] End-to-end run in the browser against live Jira

## Phase 4 — S: Stylize

- [ ] Sidebar + panel layout matching the sketch
- [ ] Four stat tiles
- [ ] Test Results Overview bar chart — inline SVG, light + dark, labelled
- [ ] Plan viewer: rendered markdown, inline edit, review findings panel
- [ ] Jira comment renders as real headings/tables (ADF, not raw markdown)
- [ ] Shown to the user for feedback; approval logged

## Phase 5 — T: Trigger

- [ ] `npm run typecheck` clean (both configs)
- [ ] `npm test` green
- [ ] End-to-end evidence block written into `PROJECT.md`
- [ ] Deployed to Vercel behind `APP_PASSWORD`
- [ ] Production smoke test: fetch → generate → share
- [ ] `README.md` — setup, env vars, API table
- [ ] Maintenance log in `gemini.md`
- [ ] *(optional)* Jira webhook trigger for auto-draft
