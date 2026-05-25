# Test Plan: VWO Login Page

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | QA Team |
| **Date** | 2026-03-17 |
| **Environment** | Production |
| **Browser** | Chromium, WebKit, Firefox |

---

## 1. Introduction

This test plan describes the testing approach for **VWO Login Page**. It outlines the scope, test strategy, resources, schedule, and deliverables for the testing effort.

## 2. Objectives

- Verify core functionality works as expected
- Identify defects before production release
- Ensure user flows are complete and error-free
- Validate UI elements and navigation

## 3. Scope

### In Scope
- Login via standard Email ID and Password credentials.
- Input validations (empty fields, invalid email format, incorrect password).
- "Toggle password visibility" (eye icon) functionality.
- "Remember me" checkbox state maintenance.
- Functionality of support links ("Forgot Password?", "Start a FREE TRIAL", "Privacy policy", "Terms").
- Third-party/SSO login initiations ("Sign in with Google", "Sign in using SSO", "Sign in with Passkey").
- UI and responsive layout checks for standard desktop/mobile resolutions.

### Out of Scope
- Complete end-to-end testing of third-party OAuth flows (e.g., Google authentication completion).
- Load testing or backend database performance analysis.
- Post-login interactions beyond successful redirection to the main dashboard.
- CAPTCHA solving techniques (if triggered by rate limits).

## 4. Test Strategy

### Test Approach
- **Automation Tool:** Playwright with @playwright/test
- **Test Type:** End-to-end functional testing
- **Browser:** Chromium, WebKit, Firefox
- **Environment:** Production (app.vwo.com)

### Test Levels
- Smoke Testing (critical paths)
- Functional Testing (all features)
- Negative Testing (invalid inputs, error handling)

## 5. Test Environment

| Component | Details |
|-----------|---------|
| Application URL | https://app.vwo.com/#/login |
| Browser | Chromium, WebKit, Firefox |
| OS | Cross-platform (Node.js) |
| Framework | Playwright v1.58+ |
| Reporter | HTML + JSON |

## 6. Entry Criteria

- Application is deployed and accessible
- Test environment is configured
- Test data is available
- Test cases are reviewed and approved

## 7. Exit Criteria

- All planned test cases executed
- All critical/high priority defects resolved
- Test report generated and reviewed
- No open blockers

## 8. Test Cases Summary

### Core Authentication Tests
| Test ID | Title | Priority | Type |
|---------|-------|----------|------|
| **Login_TC_01** | Verify successful login with correct Email ID and Password | High | Functional |
| **Login_TC_02** | Verify authentication failure with invalid Password | High | Negative |
| **Login_TC_03** | Verify authentication failure with unregistered Email ID | High | Negative |
| **Login_TC_04** | Verify validation messages when submitting empty fields | Medium | Functional |
| **Login_TC_05** | Verify inline validation for malformed Email ID (e.g. missing "@") | Medium | Functional |

### UI and Usability Tests
| Test ID | Title | Priority | Type |
|---------|-------|----------|------|
| **Login_TC_06** | Verify password visibility toggles properly upon clicking the eye icon | Medium | Usability |
| **Login_TC_07** | Verify checking "Remember me" persists the session/username across reloads | Medium | Functional |

### Alternative Login Methods and Navigation Tests
| Test ID | Title | Priority | Type |
|---------|-------|----------|------|
| **Login_TC_08** | Verify "Sign in with Google" invokes Google's authentication modal | High | Functional |
| **Login_TC_09** | Verify "Sign in using SSO" routes to SSO portal login | High | Functional |
| **Login_TC_10** | Verify "Sign in with Passkey" prompts system Passkey dialog | High | Functional |
| **Login_TC_11** | Verify clicking "Forgot Password?" opens password recovery flow | High | Navigation |
| **Login_TC_12** | Verify "Start a FREE TRIAL" opens the registration page | Medium | Navigation |
| **Login_TC_13** | Verify Privacy Policy and Terms links resolve to the correct URLs | Low | Navigation |

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Application downtime | High | Use stable test environment |
| Flaky tests | Medium | Implement proper waits, no retries |
| Environment differences | Medium | Use consistent browser version |
| Third-party Rate Limits/Captchas | Medium | Whitelist testing IPs / mock OAuth if permitted |

## 10. Schedule

| Phase | Duration |
|-------|----------|
| Test Planning | 1 day |
| Test Case Design | 1 day |
| Test Execution | 1 day |
| Defect Reporting | Ongoing |
| Test Closure | 1 day |

## 11. Deliverables

- [x] Test Plan (this document)
- [ ] Test Cases Document
- [ ] Test Execution Report (HTML)
- [ ] Defect Reports (Jira tickets)
- [ ] Test Summary Report
