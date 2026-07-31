# SOP 05 — UI specification

**Goal:** the sketch, made real and honest about state. Dark, dense, no decoration
that does not carry information.

**Owner:** `src/**`
**Reference:** the same visual language as
`../Project_07_TestOrchestratorChallenge/src/styles.css`.

---

## Shell

```
┌────────────────┬────────────────────────────────────────────────┐
│ QA Plan Agent  │  <page header: title + one-line subtitle>      │
│                │  ────────────────────────────────────────────  │
│  Dashboard     │                                                │
│  Generate      │  <panels>                                      │
│  Plans         │                                                │
│  Templates     │                                                │
│  Connections   │                                                │
│  Settings      │                                                │
│                │                                                │
│  ── status ──  │                                                │
│  ● Jira ok     │                                                │
│  ● Groq ok     │                                                │
└────────────────┴────────────────────────────────────────────────┘
```

The sidebar footer carries a live connection indicator — green when the last
verify succeeded, grey when never verified, red when the last attempt failed. It
exists so a user never starts a generation that was going to fail at step one.

*Sketch deviation, pending approval:* the sketch shows Dashboard / Settings /
Connections. **Generate**, **Plans**, and **Templates** are added because the flow
needs a place to run, a place to keep results, and a place to see the contract. If
rejected, Generate folds into Dashboard and Plans becomes a table below the chart.

## Dashboard

Four stat tiles, then the chart, then recent plans.

```
┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│  Total   ││  Passed  ││  Failed  ││In Progress│
│   142    ││    98    ││    11    ││    33     │
│ 12 plans ││   69%    ││   8%     ││  running  │
└──────────┘└──────────┘└──────────┘└──────────┘
```

Each tile carries a value **and** a denominator or rate. A bare number invites the
question it should already have answered.

**Test Results Overview** — bar chart. *Metric semantics pending Q1.* The chart
implementation follows the `dataviz` skill: inline SVG, no chart dependency,
readable in light and dark, axis and series labelled, and never a bare colour
legend as the only key.

Empty state matters more than the populated one here — a new user sees this screen
first. It reads: *"No plans yet. Generate a plan from a Jira ID →"* with the button
that does it, not four zeros.

## Generate

Single column, five steps, each disabled until the previous resolves. Nothing is
hidden behind a spinner without saying what it is doing.

1. **Source** — connection dropdown + ID field. Placeholder shows a real example
   from the configured project (`SCRUM-14`).
2. **Work item** — card: key, title, type, status, priority, labels, assignee,
   description, extracted acceptance criteria as a numbered list, link out. Linked
   items as unticked checkboxes. If no acceptance criteria were found, a plain
   notice says so before the user commits to generating.
3. **Additional context** — textarea. Hint: *"What the ticket does not say —
   environment quirks, a regression to protect, a design note. Passed to the model
   verbatim."*
4. **Document** — template, fidelity (strict/enriched), author, version,
   environment, browser, base URL. Prefilled from Settings.
5. **Generate** — a step indicator that names the actual step and elapsed time:
   `Analyzing requirements… 6s` → `Deriving test cases… 14s` → `Rendering…` →
   `Reviewing…`. On failure the failed step is marked and **Retry from here** is
   offered, so a 429 on cases does not throw away a good analysis.

Result: rendered plan on the left, tabs for Analysis JSON / Cases table / Review
findings / Render report on the right.

## Plans

Table: work item, title, cases, model, created, shared, review status. Row opens
the plan viewer. Bulk export. Delete with confirm.

## Templates

Left: template list. Right: editor with placeholder syntax highlighted, a live
list of placeholders used, and validation errors inline. Unknown placeholder →
save blocked with the name and the nearest legal placeholder suggested.

## Connections

Card per connection: kind badge, label, base URL, project, verified-as line with
timestamp. **Test connection** on each card. **+ Add connection** opens a form
whose fields change with the kind. Delete with confirm.

## Settings

Per the sketch: **Test Model** dropdown (live from the provider, free text
allowed), **API Key** (password field), **Test connection**, **SAVE**. Plus
temperature/max-token overrides behind a disclosure — sane defaults visible, knobs
available.

Every credential field shows what the server already has: placeholder
`•••••• (using server key)` when `.env` supplies it, so a blank field never looks
like a missing one.

## States every view must implement

| State | Requirement |
| --- | --- |
| loading | named — "Reading server config…", not a bare spinner |
| empty | tells the user the next action, with the button to take it |
| error | the server's message verbatim, plus the field to fix; never "something went wrong" |
| partial | a plan with a failed review step still renders; the failure is a badge, not a blank page |
| unsaved | leaving Generate mid-run warns |

## Accessibility and honesty

- Every interactive element reachable by keyboard; focus visible.
- Status never carried by colour alone — the dot has a text label beside it.
- The generated-document footer states in the UI, not only in the file, that this
  is a first draft requiring review (`gemini.md` behavioural rule 6).

## Learnings

*(Append as we go.)*
