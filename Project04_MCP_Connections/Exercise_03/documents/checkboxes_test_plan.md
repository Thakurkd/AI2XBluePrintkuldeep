# Test Plan: Checkboxes Feature

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | GitHub Copilot |
| **Date** | 2026-05-24 |
| **Environment** | staging |
| **Browser** | Chromium |

---

## 1. Introduction

This test plan describes the testing approach for **Checkboxes Feature**. It outlines scope, strategy, resources, and deliverables for verifying the Checkboxes page at the provided Base URL.

## 2. Objectives

- Verify core checkbox behavior and UI
- Find defects before release
- Ensure keyboard and accessibility support
- Validate expected user flows for toggling checkboxes

## 3. Scope

### In Scope
- Verify presence of both checkbox controls
- Verify toggling each checkbox (checked/unchecked)
- Verify toggling via mouse and keyboard
- Verify combined states (both checked, both unchecked)
- Verify behavior when navigating away and returning
- Basic visual / UI validation (labels, alignment)

### Out of Scope
- Persistence across server restarts
- Backend state or server-side storage for checkbox state
- Cross-browser compatibility beyond the stated browser (Chromium) — run separately if needed

## 4. Test Strategy

### Test Approach
- **Automation Tool:** Playwright with @playwright/test
- **Test Type:** End-to-end functional testing
- **Browser:** Chromium
- **Environment:** staging

### Test Levels
- Smoke Testing (critical paths)
- Functional Testing (all features)
- Negative Testing (invalid interactions, keyboard misuse)

## 5. Test Environment

| Component | Details |
|-----------|---------|
| Application URL | https://the-internet.herokuapp.com/checkboxes |
| Browser | Chromium |
| OS | Cross-platform (Node.js) |
| Framework | Playwright v1.58+ |
| Reporter | HTML + JSON |

## 6. Entry Criteria

- Application is accessible at the Base URL
- Test environment configured with Playwright
- Test data and browsers available

## 7. Exit Criteria

- All planned test cases executed
- All critical defects resolved or triaged
- Test report generated and reviewed

## 8. Test Cases Summary

Below are the primary test cases for the Checkboxes page. Each TC includes steps and expected results.

| TC ID | Title | Steps | Expected |
|-------|-------|-------|----------|
| TC-001 | Toggle single checkbox | 1. Open the Checkboxes page. 2. Observe initial states. 3. Click checkbox 1 to toggle its state. | Checkbox 1 toggles from unchecked to checked (or checked to unchecked) immediately. |
| TC-002 | Toggle both checkboxes | 1. Open the Checkboxes page. 2. Click both checkboxes to set them checked. 3. Click again to unset. | Both checkboxes can be set to checked and unchecked independently; both checked state is possible. |
| TC-003 | Navigation persistence within session | 1. Open page and set desired states (e.g., both checked). 2. Navigate to another internal link (home). 3. Use browser back to return to checkboxes. | The page should reflect the toggled state in the DOM until page reload (expected behavior: state remains in the session until full page reload). |
| TC-004 | Keyboard accessibility (tab + space) | 1. Open the page. 2. Tab to the first checkbox. 3. Press `Space` to toggle. 4. Repeat for second checkbox. | Each checkbox is focusable via tab and toggles when `Space` is pressed. |

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Application downtime | High | Use stable test environment |
| Flaky tests | Medium | Implement proper waits, avoid brittle selectors |
| Environment differences | Medium | Use consistent browser version |

## 10. Schedule

| Phase | Duration |
|-------|----------|
| Test Planning | 0.5 day |
| Test Case Design | 0.5 day |
| Test Execution | 0.5–1 day |
| Defect Reporting | Ongoing |
| Test Closure | 0.5 day |

## 11. Deliverables

- [x] Test Plan (this document)
- [x] Test Cases Summary
- [ ] Test Execution Report (HTML)
- [ ] Defect Reports (if any)

---

*Document created automatically from template for the Checkboxes feature.*
