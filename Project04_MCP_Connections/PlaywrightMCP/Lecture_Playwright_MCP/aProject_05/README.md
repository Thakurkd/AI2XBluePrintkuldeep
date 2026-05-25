# aProject_05: Add/Remove Elements STLC Automation

This project implements an end-to-end STLC automation pipeline for the Add/Remove Elements page on The Internet.

## Contents
- `test_plan.md` — test plan and scope document
- `tests/` — 5 Playwright test specs
- `playwright.config.js` — Playwright config for this project
- `reports/` — generated HTML and JSON reports
- `mcp_scripts/` — result parser and Jira ticket creation scripts
- `run_pipeline.js` — master pipeline script

## How to run
1. Start the mock Jira server from the Lecture_Playwright_MCP root:
   ```bash
   node stlc_project/jira_mock/jira_mock_server.js
   ```
2. Run the pipeline from `Lecture_Playwright_MCP`:
   ```bash
   node aProject_05/run_pipeline.js
   ```

## Notes
- The pipeline executes tests, parses JSON results, and creates Jira tickets for failures.
- One intentional failing test is included to ensure Jira ticket creation is exercised.
