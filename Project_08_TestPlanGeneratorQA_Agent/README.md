# QA Plan Agent — test plans from work items

Paste a Jira key. Get a complete, template-conformant test plan grounded strictly
in that ticket, with test cases traced to acceptance criteria — then share it back
to the ticket it came from.

```
SCRUM-5  →  analyse  →  test cases  →  your template  →  Jira comment + attachment
```

Built with the **B.L.A.S.T.** protocol. [WORKFLOW.md](WORKFLOW.md) is the map,
[gemini.md](gemini.md) is the law, [architecture/](architecture/) holds the SOPs.

---

## Run it locally

```bash
npm install
cp .env.example .env      # fill in Jira + one model key
npm run dev:api           # API on :5008
npm run dev               # app on :5173   <- open this
```

Two terminals. The browser only ever talks to `/api`; Vite proxies that to the API,
so no credential reaches the front end.

### Prove the wires before using it

```bash
npm run link:all      # Jira identity, one real issue, model round-trip, model lists
npm run e2e           # the whole pipeline against live Jira and a live model
```

`link:all` prints the account behind each credential rather than `ok` — a token can
be valid and still point at the wrong site. `e2e` writes the generated plan to
`.tmp/` and exits non-zero on any failure, so it can gate a deploy.

```bash
npm test          # 60 unit tests
npm run typecheck # both tsconfigs
npm run build     # production bundle
```

---

## Environment

Everything is optional except a Jira credential and one model key. Blank fields in
the UI fall back to these.

| Variable | Notes |
| --- | --- |
| `PORT` | API port, default `5008` (Project_07 uses 5007, so both can run) |
| `APP_PASSWORD` | Gates every `/api` route. Leave blank locally; **set it on Vercel** |
| `JIRA_BASE_URL` | Site root, no trailing slash |
| `JIRA_EMAIL` · `JIRA_API_TOKEN` | [Create a token](https://id.atlassian.com/manage-profile/security/api-tokens) |
| `JIRA_PROJECT_KEY` | Default project, e.g. `SCRUM` |
| `JIRA_AC_FIELD` | Custom field holding acceptance criteria, if the site has one. Blank → read from the description |
| `LLM_PROVIDER` | `groq` · `xai` · `openai` · `claude` · `gemini` · `ollama` |
| `LLM_MODEL` | Names a model **for `LLM_PROVIDER`**; ignored if you switch provider |
| `GROQ_API_KEY` · `XAI_API_KEY` · `OPENAI_API_KEY` · `ANTHROPIC_API_KEY` · `GEMINI_API_KEY` | one is enough |
| `OLLAMA_ENDPOINT` | default `http://localhost:11434/api/chat` |

`groq` (Groq Cloud) and `xai` (Grok) are different products. The UI labels them
"Groq Cloud" and "Grok (xAI)" so they cannot be mixed up.

---

## The screens

| Screen | What it is for |
| --- | --- |
| **Dashboard** | Four stat tiles and outcomes by status, across every plan in this browser |
| **Generate** | The flow: key → work item → context → template → generate |
| **Plans** | Everything generated here. Open, mark cases off, export, share |
| **Templates** | The document itself, editable, with placeholder validation at save time |
| **Connections** | Jira, with a Test Connection that names the account it reached |
| **Settings** | Provider, model (live list from the provider), key, Test Connection |

---

## API

Everything sits behind `/api`. When `APP_PASSWORD` is set, all of it except
`/api/health` requires an `x-app-password` header.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness, and whether the gate is on |
| POST | `/api/auth` | check a password, no side effects |
| GET | `/api/config` | what the server has configured (never key material) |
| POST | `/api/connections/test` | returns the identity behind the credential |
| POST | `/api/connections/workitems` | id → canonical work items + linked items |
| GET | `/api/llm/models?provider=` | live model list, non-chat models filtered out |
| POST | `/api/llm/test` | one round trip: latency + whether JSON mode held |
| GET | `/api/plan/placeholders` | the template contract |
| POST | `/api/plan/validate-template` | save-time validation |
| POST | `/api/plan/analyze` | → `PlanAnalysis` |
| POST | `/api/plan/cases` | → `TestCase[]` |
| POST | `/api/plan/render` | → markdown. **Deterministic — no model call** |
| POST | `/api/plan/review` | → findings, plus what was withheld |
| POST | `/api/share/preview` | the exact comment that would be posted |
| POST | `/api/share/jira` | comment and/or attachment on the issue |

The client calls `analyze` → `cases` → `render` in sequence rather than one
combined endpoint, because three chained model calls exceed the 60-second
serverless ceiling. The upside: a rate limit at step two does not throw away
step one — the UI offers **retry from here**.

---

## How it works

**The model produces data. Code produces the document.** No prompt ever asks for a
test plan. `analyze` returns a JSON object mirroring the template's sections,
`cases` returns test cases, and `render.ts` fills the `{{PLACEHOLDER}}` slots.

That is why section order never drifts between runs, why an unfilled slot is a
reported gap rather than a stray `{{PLACEHOLDER}}`, and why changing the model
changes prose quality but never document validity.

Three model calls exist, and no more:

| Prompt | Returns | Budget |
| --- | --- | --- |
| **P1** analyse the work item | `PlanAnalysis` — 25 fields across 14 sections | 4000 tokens, temp 0.15 |
| **P2** derive test cases | `TestCase[]`, one per acceptance criterion minimum | 4000 tokens, temp 0.20 |
| **P3** review the plan (optional) | findings, never a rewrite | 2500 tokens, temp 0.10 |

Everything else — ID parsing, ADF flattening, criteria splitting, ID assignment,
coverage checking, rendering, markdown→ADF — is deterministic and unit-tested.

### What it refuses to do

- **Invent a requirement.** Anything the ticket does not say goes to §14 Open
  Questions. A plausible invention is the worst output, because a reviewer cannot
  tell it from a real requirement.
- **Ship an unresolved placeholder.** `render` fails loudly, naming each one.
- **Accept a truncated reply.** A cut-off response often still parses, so every
  provider's length signal is checked and the reply refused.
- **Hide a coverage gap.** An acceptance criterion with no test case appears in the
  document, not only in a report.
- **Post anything without confirmation.** The dialog names the exact ticket.

---

## Deploy

```bash
vercel                          # or push to a connected repo
```

`vercel.json` builds the Vite app to `dist` and mounts the same Express app as one
serverless function with `maxDuration: 60`. Set every variable you use in the
Vercel dashboard — **including `APP_PASSWORD`**, since the deployed API holds a
Jira token and a model key.

**Ollama is local-only.** A local 3B model took 23.6s for a trivial request where
Groq took 1.0s; a full plan cannot finish inside the serverless limit. Settings
says so rather than letting it time out.

---

## Limits worth knowing

- **Plans live in this browser.** localStorage, no server store — private to one
  browser, no share links, and "Clear workspace" is final.
- **Jira only.** Azure DevOps and X-Ray have written SOPs
  ([01_connections](architecture/01_connections.md),
  [04_share_export](architecture/04_share_export.md)) and no implementation.
- **Groq's free tier is 8,000 tokens/minute**, per request as well as per minute.
  A full plan plus review runs close to it; the client waits out per-minute limits
  and tells you plainly when a daily quota is spent.
- **Strict template fidelity only.** Your boilerplate stays byte-identical.
  `enriched` mode is specified and unbuilt.
- **A generated plan is a first draft that removes the blank page.** The document
  says so in its own footer. Review every section before approval.
