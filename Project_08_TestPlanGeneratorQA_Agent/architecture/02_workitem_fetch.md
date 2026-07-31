# SOP 02 — Work item resolution and fetch

**Goal:** turn whatever the user typed into a canonical `WorkItem[]`, losing
nothing an LLM needs and inventing nothing it does not.

**Owner:** `tools/connectors/*`, `tools/util/{adf,html}.ts`, `POST /api/workitems/fetch`
**Law:** `gemini.md` invariants 3, 9; behavioural rule 1 (ask, never guess).

---

## S1 — ID resolution

The user types one thing. We work out which tool it belongs to.

| Pattern | Reading | Connector |
| --- | --- | --- |
| `^[A-Z][A-Z0-9_]*-\d+$` (`SCRUM-14`) | Jira issue key, or an X-Ray key | Jira, unless the prefix matches an X-Ray project |
| `^\d+$` (`4821`) | ADO work item id | ADO |
| full URL | parse the key out of `/browse/KEY` or `/_workitems/edit/ID` | inferred from the host |
| comma/space separated list | many items, one plan | all resolve to the same connector or it is an error |

**Ambiguity rule.** If a key matches more than one configured connection, the UI
asks which one. It does not pick the first, and it does not try all of them — a
silent wrong-project fetch is worse than a question.

**Single connection configured** → skip the question entirely; the answer is
obvious and asking would be noise.

## S2 — Fetch

- Jira: `GET /rest/api/3/issue/{key}` with an explicit `fields` list —
  `summary, description, status, issuetype, priority, assignee, reporter, labels,
  components, subtasks, issuelinks, parent` plus any acceptance-criteria custom
  field discovered in Phase 2.
- ADO: `GET .../wit/workitems/{id}?$expand=relations&api-version=7.1` **⚠ verify**
- Linked items are fetched to **depth 1 only** and capped at `maxLinked` (default
  10). Unbounded graph traversal on an epic pulls a hundred issues, blows the
  token budget, and produces a plan about nothing in particular.
- Linked items arrive **unticked**. The user decides what is in scope; the tool
  does not decide for them.

## S3 — Normalisation

### Jira: ADF → text

Descriptions are Atlassian Document Format — a nested node tree, not a string.
Reuse the walk from
`../Project_07_TestOrchestratorChallenge/server/services/jira.service.ts`. What
must survive: paragraphs, headings, bullet and ordered lists **with nesting
depth**, code blocks, table rows and cells, hard breaks, and link text.

Dropping list structure is the failure that matters most here, because acceptance
criteria are almost always a list, and a flattened list becomes one run-on
sentence the model then mis-splits.

### ADO: HTML → text

`System.Description` and `Microsoft.VSTS.Common.AcceptanceCriteria` are HTML.
`tools/util/html.ts` maps `<ul>/<li>` to bullets, `<table>` to rows, `<br>` to
newlines, strips the rest, and decodes entities. Same survival list as ADF.

### Acceptance criteria → `string[]`

Priority order:

1. A dedicated custom field, if this site has one (**⚠ Phase 2 must check**).
   Always preferred — it is structured data rather than scraped prose.
2. An "Acceptance Criteria" / "AC" heading in the description. Take everything
   until the next heading (`Definition of Done`, `Notes`, `Out of Scope`,
   `Dependencies`).
3. Gherkin blocks (`Given/When/Then`) anywhere in the description — each scenario
   is one criterion.

Then split into an array on bullet markers, numbered lines, or `Given` starts.
**One criterion per array entry** — P2's coverage rule ("at least one case per
criterion") only works if the split is right, so this function gets unit tests
against real ticket text.

If none of the three sources yields anything, `acceptanceCriteria` is `[]` and the
UI says so plainly before generation: *"No acceptance criteria found in SCRUM-14 —
coverage will be based on the description alone."* A plan built on a description
alone is legitimate; a plan that pretends it had criteria is not.

## Outputs

`WorkItem[]` per `gemini.md` §2.3. `fetchedAt` is stamped server-side. The raw
provider payload is not persisted — it is large, it contains fields we do not
understand, and keeping it invites someone to read it directly and bypass this
SOP.

## Edge cases

- Issue exists but the account cannot see it → 403, not "not found". Say which.
- Description empty → legitimate; carry on and let §14 Open Questions carry the
  consequence.
- Non-English description → pass through untouched. Do not translate; a
  translated requirement is a changed requirement.
- Attachments and images → out of scope for v1. Note in Open Questions that the
  item has attachments the plan did not read.
- Epic with 60 children → cap, and tell the user what was capped.

## Learnings

*(Append as we go.)*
