# SOP 04 — Share and export

**Goal:** get the finished plan out of the browser and into the tool the work item
came from. A plan that exists only in a tab is not a delivered payload
(`gemini.md` §4).

**Owner:** `tools/share/*`, `POST /api/share/*`
**Law:** `gemini.md` invariant 5 (confirm before anything leaves the app).

---

## Confirmation contract

Every share shows a dialog naming the exact destination before the request is
made:

> Post this test plan as a comment on **SCRUM-14** in `singhkd332.atlassian.net`?

Approving one target never implies another. Approving once never implies again.
A share that fails is reported as failed; the `ShareRecord` is written only on a
confirmed success response.

## Targets

### 1. Jira comment

`POST /rest/api/3/issue/{key}/comment` — the body must be **ADF**, not markdown
(`findings.md` §5). Posting raw markdown produces a comment full of literal `##`
and `|`, which looks broken to everyone on the ticket.

So `tools/share/markdownToAdf.ts` is required, not polish. Minimum coverage:
headings 1–3, paragraphs, bullet and ordered lists, tables, bold/italic, inline
code, code blocks, links, horizontal rules.

A full 15-section plan may exceed a comfortable comment length. Default: post a
**summary comment** (objective, scope, case counts, open questions, link to the
attachment) and attach the full document. A wall-of-text comment gets ignored,
which defeats the purpose of sharing it.

### 2. Jira attachment

`POST /rest/api/3/issue/{key}/attachments` with `X-Atlassian-Token: no-check` and
multipart form data **⚠ verify in Phase 2**. Filename:
`TestPlan_<KEY>_v<VERSION>_<YYYY-MM-DD>.md`.

### 3. ADO comment — *if Q2 includes ADO*

Work-item comments API; ADO takes HTML, so markdown → HTML rather than → ADF.
Same summary-plus-attachment split.

### 4. X-Ray test plan — *if Q2/Q3 include X-Ray*

The only target that creates real test *entities*: a Test Plan holding one Test
per `TestCase`, with steps mapped to X-Ray test steps. Cloud is GraphQL, Server/DC
is REST, and they are not interchangeable — **which one must be confirmed before
any code is written** (`findings.md` §7).

### 5. File export

Client-side download, no server round trip:

| Format | Contents |
| --- | --- |
| `.md` | the rendered plan verbatim |
| `.json` | the whole `TestPlan` — analysis, cases, meta, model used |
| `.csv` | test cases only, one row per case, for import into a test manager |

The JSON export is the audit trail: it records which model produced the plan, from
which work item, at what time, with what additional context. Without it, "where
did this plan come from?" has no answer six weeks later.

### 6. Share link — *only if Q4 chooses a server store*

Impossible with localStorage-only persistence, because there is nothing for the
recipient to read. If chosen: a random unguessable id, an explicit expiry, and a
revoke action. Never a sequential id.

## Idempotency

Re-sharing the same plan to the same target is a common accident (a double click,
a re-render). Before posting, check `plan.shares` for an existing record with the
same target and ref, and offer *"Already shared 12 minutes ago — post again?"*
rather than creating a duplicate comment on someone's ticket.

## Edge cases

- Account can read but not comment → 403. Say "the account lacks the Add Comments
  permission on this project", not "share failed".
- Attachments disabled on the project → offer the comment path instead.
- Plan contains no cases → block the share. A test plan with no test cases is not
  a deliverable.
- Very large plan (>32 KB) → attachment only, comment carries the summary.

## Learnings

*(Append as we go.)*
