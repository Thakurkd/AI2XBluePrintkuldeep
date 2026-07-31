# findings.md — research, discoveries, constraints

Everything learned that the code should not have to rediscover. Entries marked
**⚠ unverified** are from documentation or prior work and must be proven by a
Phase 2 handshake before anything is built on them.

---

## 1. Project_07 is a working reference — what to reuse

`../Project_07_TestOrchestratorChallenge` runs the same two-process shape and is
deployed on Vercel against live Jira. Reuse, do not re-invent:

| Asset | File | Why it is worth taking |
| --- | --- | --- |
| ADF flattener | `server/services/jira.service.ts` `adfToText()` | Jira descriptions are a nested node tree, not text. This walk keeps prose, bullets, code blocks, and table rows. |
| Acceptance-criteria extractor | same file, `extractAcceptanceCriteria()` | Finds an "Acceptance Criteria" heading and stops cleanly at the next section. Project_08 needs it as an **array**, so this becomes a splitter too. |
| Config override pattern | `server/config.ts` `resolveJiraConfig()` | Per-request overrides fall back to `.env`, so the browser never holds a token. Exactly the "add a connection on the fly" behaviour we need. |
| Multi-provider LLM client | `server/services/llm.service.ts` | Groq, OpenAI, Claude, Gemini, Ollama behind one `chat()`. Project_08 adds `xai` (Grok) — OpenAI-compatible, so it is a URL and a label. |
| Rate-limit retry | same file, `withRateLimitRetry()` | Waits out per-minute limits, refuses to sleep on per-day quotas. |
| Tolerant JSON parse | same file, `parseJSON()` | Models wrap JSON in prose and fences. Takes the largest balanced span. |
| Password gate | `server/app.ts` `passwordGate()` | Constant-time compare, open when `APP_PASSWORD` is unset. |
| Vercel wiring | `vercel.json`, `api/index.ts`, `vite.config.ts` | `rewrites: /api/(.*) → /api`, `maxDuration: 60`, dev proxy 5173 → 5007. Proven deploy. |

**Deliberately not reused:** Project_07's plan prompt asks the model to write the
whole markdown document. Project_08 inverts that — the model returns JSON and code
renders the template (`gemini.md` invariant 1).

## 2. Free-tier rate limits shape the pipeline

Groq's free tier allows roughly 12,000 tokens/minute. Project_07 recorded that a
plan-then-cases run exceeded it in a single user action. Consequences carried
forward:

- `max_tokens` is right-sized per call, not set to one large default
  (P1 2500 / P2 4000 / P3 1500).
- Per-minute 429s are waited out using `Retry-After`; per-day quotas fail fast
  with a human message and a "switch model in Settings" hint. Sleeping on a
  multi-hour quota just burns the request budget and returns a meaningless
  timeout.

## 3. Models drift on IDs

Project_07 found models duplicate test-case numbers across stories and invent ID
formats. Fix: the prompt does not ask for an ID; `tools/util/ids.ts` assigns
`<WORK_ITEM_KEY>-TC-001` sequentially after parsing. Same reasoning applies to any
field with a required format.

## 4. Vercel's 60-second ceiling drives the API shape

`maxDuration: 60` on the serverless function. Three chained LLM calls will exceed
it on a slow model or a cold Ollama. **Therefore the client sequences the pipeline**
— separate `/analyze`, `/cases`, `/render`, `/review` calls, each comfortably
inside the limit, each rendering progress. A combined `/generate` exists for local
and CLI use only, where there is no ceiling.

Second consequence: the serverless filesystem is ephemeral. Nothing may be written
to disk and expected to survive. Persistence is localStorage or a real store
(open question Q4).

## 5. Jira Cloud API notes

- `POST /rest/api/3/search` was replaced by `POST /rest/api/3/search/jql`. Sites
  sit on different sides of the migration, so try the new endpoint and fall back
  on 404/410 — Project_07 already does this.
- Auth is Basic with `email:apiToken` base64-encoded. A 401 means the token or
  email is wrong; a 403 means the account lacks project permission. Say which.
- Fetch by key: `GET /rest/api/3/issue/{key}` with an explicit `fields` list.
- **⚠ unverified** Comment: `POST /rest/api/3/issue/{key}/comment` — the body must
  be **ADF**, not markdown. Posting markdown produces a comment full of literal
  `##` and `|`. A markdown→ADF converter is therefore required for sharing, not
  optional polish.
- **⚠ unverified** Attachment: `POST /rest/api/3/issue/{key}/attachments` requires
  the `X-Atlassian-Token: no-check` header and multipart form data.
- **⚠ unverified** Acceptance criteria may live in a custom field
  (`customfield_XXXXX`) rather than the description. Phase 2 must check this Jira
  site specifically; if present, prefer the field over heading-scraping.

## 6. Azure DevOps API notes — **⚠ all unverified, Phase 2 task 2.5**

- Work item: `GET https://dev.azure.com/{org}/{project}/_apis/wit/workitems/{id}?api-version=7.1`
- Auth: Basic with an empty username and the PAT as the password.
- `System.Description` and `Microsoft.VSTS.Common.AcceptanceCriteria` come back as
  **HTML**, not ADF and not plain text — so `tools/util/html.ts` is the ADO
  equivalent of the ADF flattener.
- IDs are bare integers (`4821`), which is what makes ID-based connector routing
  possible without asking the user which tool they meant.

## 7. X-Ray API notes — **⚠ all unverified, Phase 2 task 2.6**

- Cloud and Server/DC have **different APIs**. Cloud: authenticate at
  `POST https://xray.cloud.getxray.app/api/v2/authenticate` with
  `{client_id, client_secret}` to get a bearer token, then use the GraphQL
  endpoint. Server/DC uses REST under `/rest/raven/`.
- Which one this project targets is unknown and must be asked before any X-Ray
  work starts — building against the wrong one is a total loss.
- X-Ray is the only connector that can supply **real execution results**, which is
  why open question Q1 (dashboard metric semantics) is coupled to it.

## 8. Grok and Groq are different products

`groq` = Groq Cloud, `https://api.groq.com/openai/v1` — fast inference of open
models (llama, gpt-oss). `xai` = Grok, `https://api.x.ai/v1` — xAI's own model,
also OpenAI-compatible. Supporting "Grok" and meaning Groq (or the reverse) is an
easy and confusing bug, so the UI labels are explicit and the provider ids differ.

## 9. Live model lists beat hardcoded dropdowns

The sketch's "Select your model here" should not be a stale hardcoded array —
Project_07's list already names models that come and go. Every provider we support
exposes a list endpoint:

| Provider | List endpoint | **⚠** |
| --- | --- | --- |
| Groq | `GET /openai/v1/models` | verify |
| xAI | `GET /v1/models` | verify |
| OpenAI | `GET /v1/models` | verify |
| Claude | `GET /v1/models` | verify |
| Gemini | `GET /v1beta/models` | verify |
| Ollama | `GET /api/tags` | verify |

Plan: fetch live, cache per session, fall back to a small curated list if the call
fails, and always allow free text so a brand-new model id is never blocked by our
UI.

## 10. The template is mostly boilerplate — and that is the point

`Chapter_02_Prompt_Eng/Project_02_RealProject1/Prompt_Templates/test_plan.md` is
the team's real template. Reading it closely changes the design:

- Only **four** slots are marked in the original: `<Product Details>`,
  `<Target Audience>`, `<Features>`, `[Your Name]`. Everything else — the OS list,
  the browser list, the defect-triage steps, the best-practice paragraphs, the
  STLC entry/exit structure — is fixed prose the team wants in every plan.
- So "generate a test plan" is **not** "write 13 sections of prose". It is: fill a
  handful of judgement slots correctly, and leave the standard content alone. A
  model asked to write the whole document would rewrite the boilerplate slightly
  differently every run, and the team would lose the thing that makes it their
  template.
- Several sections *should* nonetheless be story-specific: §2 features, §4
  exclusions, §7 techniques and E2E flows, §8 schedule, §10 entry/exit, §12 risks.
  Hence the `strict` / `enriched` fidelity switch (`gemini.md` §2.9) rather than
  one global answer.
- The original has no test-case section and no assumptions section. Both were
  added (§13, §14) because a plan generated from a ticket must show its coverage
  and must be honest about what the ticket did not say. §13 Approvals became §15
  with its content untouched.

## 11. Phase 2 handshake results — 2026-07-31, all green

Run `npm run link:all`. Every claim below was printed by a real API call, not read
from documentation.

### Jira — `npm run link:jira`

```
account            kuldeep singh
email              singhkd332@gmail.com
accountId          712020:56ec76e4-6bec-4aed-b2cf-44bdb04a8396
timezone           Asia/Calcutta
projects visible   1  →  SCRUM (SDETSPACE)
```

**Resolved: no acceptance-criteria custom field on this site.** `/rest/api/3/field`
returned nothing matching acceptance/criteria/gherkin, so `JIRA_AC_FIELD` stays
blank and the description-scraping path in `tools/util/criteria.ts` is *the* path,
not a fallback. That raises its importance — it now has no safety net, so it keeps
its own file and its own tests.

Only one project is visible to this account. Worth knowing: a UI that offers a
project picker would show a list of one.

### Jira issue + ADF + criteria — `npm run link:issue`

`SCRUM-5` "Customer can sign in to the storefront with email and password":

```
1412 chars of description survived flattening
headings preserved as ### Context / ### Acceptance Criteria / ### Out of Scope
8 acceptance criteria split correctly, one per bullet
0 linked items
```

Both utilities are proven against real ADF. Notable: the story also carries an
**"Out of Scope"** section, and `SECTION_END` correctly stops the criteria scrape
there — without that stop, three out-of-scope items would have become acceptance
criteria and produced three test cases for features that do not exist. This is the
single highest-value regression test to write in Phase 3.

### Groq — `npm run link:llm`

```
model        openai/gpt-oss-120b
latency      969 ms
tokens       148 in / 158 out
JSON mode    honoured — parsed first try
```

### Ollama — `npm run link:llm -- --provider ollama --model llama3.2:3b`

```
latency      23,640 ms   ← for a 200-token request
JSON mode    honoured (format: json)
```

**24 seconds for a trivial request is a design constraint, not a curiosity.**
Groq is ~25× faster on the same task. Consequences:

- Ollama stays selectable (it is the only zero-cost, offline-capable option) but
  is **not** the default, and the UI must warn that a local 3B model will take
  minutes for a full plan where Groq takes seconds.
- A 4000-token P2 call on `llama3.2:3b` would exceed Vercel's 60s function ceiling
  outright — so Ollama is a **local-only** provider in practice. The Settings
  screen should say so rather than let someone pick it on the deployed app and
  watch it time out.
- This confirms the client-sequenced pipeline decision in §4. A single combined
  `/generate` endpoint would be unusable on any local model.

### Live model lists — `npm run link:models`

Groq returned **15** models live; Ollama returned **1** (`llama3.2:3b`). xAI,
OpenAI, Claude, and Gemini were skipped for missing keys — correctly, and with a
message saying so rather than a failure.

**New finding: the model list needs filtering.** Groq's `/models` includes models
that cannot do chat completion at all — `whisper-large-v3`,
`whisper-large-v3-turbo` (speech to text), `meta-llama/llama-prompt-guard-2-22m`
and `-86m` (classifiers). Offering these in a "Test Model" dropdown guarantees a
confusing failure for whoever picks one. The dropdown must exclude known non-chat
families (`whisper*`, `*prompt-guard*`, `*orpheus*`, `*-tts`, `*embed*`) while
still allowing free text, so a brand-new model id is never blocked by our filter.

## 12. Phase 3 — what building it taught us

Six defects found by running the thing, not by reading it. Full detail in
`architecture/03_plan_generation.md §Learnings`; the short version:

| # | Found by | Defect | Fix |
| --- | --- | --- | --- |
| 1 | e2e run | Groq 400s on JSON mode unless the messages contain the word "json" — P1 said "JSON", P2 and P3 did not | prompts reworded **and** `ensureJsonMentioned()` guard in the client |
| 2 | e2e run | `max_tokens: 2500` silently truncated the analysis; a partial JSON prefix parsed cleanly and 15 sections fell back to defaults | refuse truncated replies via each provider's own signal; analyze cap → 4000 |
| 3 | e2e run | review payload 8,446 tokens vs Groq's 8,000 per-request ceiling → HTTP 413, feature impossible | `reviewablePlan()` drops boilerplate sections the prompt already ignores, and names what it dropped |
| 4 | e2e run | Groq reports a truncated JSON reply as *"Failed to validate JSON. Please adjust your prompt."* | review cap → 2500; error message translated into something actionable |
| 5 | unit test | `markdownToAdf` split table cells on every `\|`, cutting any cell containing an escaped pipe in two | split on unescaped pipes only |
| 6 | screenshot | chart axis read **0, 1, 3, 4, 5** — labels were rounded from 1.25/2.5/3.75, so none sat on its own gridline | pick a whole-number step first, then derive labels |
| 7 | user's own run | a pipeline failure showed a red ✕ at the bottom of the page with the reason in a banner scrolled off the top — the user saw a failure with no cause | the reason now renders next to the step that failed |
| 8 | browser flow | the 15s retry cap turned Groq's recoverable 27s per-minute limit into a failed run | retry caps are environment-aware: 35s locally, 12s on serverless where the platform kills the function at 60s |
| 9 | browser flow | 8 acceptance criteria produce 11+ fully specified cases, which ran past the 4000-token cap | cap → 5000, conciseness rules in P2, and a documented 14-case ceiling the model must report rather than silently exceed |

### The free-tier arithmetic, since it governs everything

Groq's free tier allows **8,000 tokens per minute**, and that applies to a single
request as well as to the window:

```
analyze   ~1,600 in + up to 4,000 out   = 6,642 measured
cases     ~2,500 in + up to 5,000 out   → refused while the window held 6,642
review    ~5,000 in + up to 2,500 out   = 8,446 before trimming → HTTP 413
```

So a full run genuinely cannot fit inside one minute on the free tier. Three
things make it work anyway: the client waits out per-minute limits locally, each
step is its own request so nothing already done is lost, and the review payload is
trimmed to the sections that can actually produce a finding. A paid tier or a
larger-quota model removes the waiting entirely — which is what Settings suggests
when a limit is hit.

**The known limit we did not build past:** beyond roughly 14 test cases, no single
response holds the set. The durable fix is to split generation across calls
(per work item, or per group of criteria) and merge. Until then the error names the
criteria count and tells the user to generate for fewer items at a time — a stated
limit, not a silent truncation.

**The one worth remembering: defect 2 looked like a model-quality problem.** The
output was coherent, plausible, and thin — exactly what a small model produces. It
was a cut-off response from a capable one. The lesson generalises: before
concluding a model is weak, confirm it was allowed to finish.

**Where the review step proved its worth.** On a plan whose every acceptance
criterion had a test case — zero mechanical coverage gaps — the reviewer returned a
Blocker: AC-6 promises a 15-minute lockout, and while a case checked the lockout
*message*, none verified the account *unlocks* afterwards. Mapping criteria to
cases cannot see a partially covered criterion.

## 13. Credentials available now

Copied from `../Project_07_TestOrchestratorChallenge/.env` into this project's
gitignored `.env`:

- Jira Cloud site `singhkd332.atlassian.net`, project `SCRUM`, with an API token —
  the same live site Project_07 was verified against, so Phase 2's Jira handshake
  should pass immediately.
- Groq API key, default model `openai/gpt-oss-120b`.
- Ollama endpoint `http://localhost:11434/api/chat` (needs `ollama serve` running).
- No OpenAI / Anthropic / Gemini / xAI key yet — those providers will be
  selectable but will fail the Test Connection until a key is supplied. That is
  the correct behaviour, not a bug.
