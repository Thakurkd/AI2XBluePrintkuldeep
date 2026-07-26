# Test Orchestrator

A web app that walks a requirement from Jira ticket to runnable automation code:

**Jira user stories → test plan → test cases → dashboard → Playwright/Selenium code.**

Each stage feeds the next. The test plan shapes test-case coverage; a selected
test case becomes the specification the code generator compiles against.

## Stack

| Layer    | Tech                                             |
| -------- | ------------------------------------------------ |
| Frontend | React 19, Vite, TypeScript                        |
| Backend  | Node, Express 5, TypeScript                       |
| Jira     | Jira Cloud REST v3, Basic auth with an API token  |
| LLM      | Groq (default), OpenAI, Claude, Gemini, or Ollama |

## Setup

```bash
# backend
cd backend
npm install
cp .env.example .env     # then fill in the values below
npm run dev              # http://localhost:5007

# frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Vite proxies `/api` to port 5007, so the browser never holds an API key.

### Required `.env` values

| Variable         | Notes                                                          |
| ---------------- | -------------------------------------------------------------- |
| `JIRA_BASE_URL`  | Site root, no trailing slash — `https://acme.atlassian.net`      |
| `JIRA_EMAIL`     | The account the API token belongs to                             |
| `JIRA_API_TOKEN` | https://id.atlassian.com/manage-profile/security/api-tokens      |
| `JIRA_PROJECT_KEY` | Optional default project, e.g. `SCRUM`                         |
| `GROQ_API_KEY`   | https://console.groq.com/keys                                    |

Settings in the UI override these per-browser, but blanks fall back to `.env` —
so the token can stay server-side.

## Using it

1. **Settings** — confirm the server sees your Jira site and LLM key. *Test connection* proves the credentials reach Jira.
2. **User Stories** — fetch by project key or raw JQL, then tick the stories to work on.
3. **Test Plan** — generates scope, approach, risks, and open questions from the selected stories.
4. **Test Cases** — derives structured cases (`SCRUM-12-TC-001`) covering positive, negative, and boundary paths. Optionally aligned to the plan.
5. **Dashboard** — every case in one filterable list. Pick one to automate.
6. **Code Generator** — emits a page object plus a spec, in Playwright or Selenium, across five languages.

Stories, plans, cases, and code persist in browser local storage.

## API

| Method | Route                        | Purpose                                |
| ------ | ---------------------------- | -------------------------------------- |
| GET    | `/api/health`                | Liveness                               |
| GET    | `/api/config`                | What's configured server-side (no secrets) |
| POST   | `/api/jira/verify`           | Prove the credentials reach Jira       |
| GET    | `/api/jira/projects`         | Visible projects                       |
| POST   | `/api/jira/stories`          | Fetch stories by project key or JQL    |
| GET    | `/api/jira/stories/:key`     | One story, refreshed                   |
| POST   | `/api/generate/test-plan`    | Stories → Markdown plan                |
| POST   | `/api/generate/test-cases`   | Stories (+ plan) → structured cases    |
| POST   | `/api/generate/code`         | One case → automation code             |

## Notes on generation quality

Two problems needed more than prompting:

- **Missing type imports.** Models annotate with Playwright's `Page` and then
  forget to import it. [codeRepair.ts](backend/src/services/codeRepair.ts) adds
  any referenced-but-unimported type deterministically.
- **Self-imports.** Asked for one self-contained file, models sometimes define
  the page object *and* import it from a sibling path — a duplicate-identifier
  error. The repair pass drops the redundant import.

Both are no-ops on correct output. `npm test` in `backend/` covers them.

**Rate limits.** Groq's free tier allows 12,000 tokens/minute, which a
plan-then-cases run can exceed. The LLM client honours the provider's
`Retry-After` and waits rather than surfacing a 429.

**Model choice matters.** `llama-3.3-70b-versatile` produces sound structure but
drifts on details. For code you intend to run with light editing, a stronger
model is worth the cost.

## Scripts

```bash
# backend
npm run dev        # nodemon + ts-node
npm run typecheck  # tsc --noEmit
npm test           # code-repair unit tests

# frontend
npm run dev
npm run build      # tsc -b && vite build
```
