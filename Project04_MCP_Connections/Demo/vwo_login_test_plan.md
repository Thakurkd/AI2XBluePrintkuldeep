# Test Plan: VWO Login Page

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Author** | Antigravity QA AI |
| **Date** | 2026-05-24 |
| **Environment** | Production (app.vwo.com) |
| **Browser** | Chromium, Firefox, WebKit |
| **Verification Method** | Automated live capture via Playwright |

---

## 1. Introduction

This test plan describes the testing approach for **VWO Login Page**. It outlines the scope, test strategy, resources, schedule, and deliverables for the testing effort. 

The login page was accessed and verified live using the Playwright MCP automation driver on **2026-05-24**, and a fresh live layout capture was saved to `c:\Users\Kd singh\Desktop\AI2xBlueprint\Project04_MCP_Connections\Screenshots\vwo_login_live.png` for layout reference.

## 2. Objectives

- Verify core functionality works as expected
- Identify defects before production release
- Ensure user flows are complete and error-free
- Validate UI elements and navigation

## 3. Scope

### In Scope
- **Visual Verification of Login Page**: Validate the layout, logos, fonts, placeholders, and messaging, including the "VWO + ABTasty" integration panel on the right side of the screen.
- **Login Input Field Validations**:
  - Email ID field: Placeholder checking ("Enter email ID"), input length validation, formatting validations (e.g. invalid syntax like missing `@` or domain).
  - Password field: Placeholder checking ("Enter password"), password masking by default, and password length checking.
- **Interactive UI Components**:
  - Password Visibility Toggle: Verify that clicking the "eye" icon shows the password in plain text and clicking it again masks it.
  - "Remember me" Checkbox: Verify checking/unchecking and state retention upon page refresh/session re-entry.
  - Primary "Sign in" Button: Verify execution behavior under click and keypress (Enter).
- **Alternative Authentication Options**:
  - "Sign in with Google": Redirection and basic landing page check.
  - "Sign in using SSO": Redirection to Single Sign-On credentials page.
  - "Sign in with Passkey": Triggering the browser's native passkey authenticator prompt.
- **Call-to-Action Links**:
  - "Forgot Password?": Verify redirection to the recovery page.
  - "Start a FREE TRIAL": Verify redirection to the signup/trial registration page.
- **Footer Integrity**:
  - "Privacy policy" Link: Verify redirection to VWO's privacy policy page.
  - "Terms" Link: Verify redirection to VWO's terms of service page.
- **Error Handling & Validations**:
  - Validate response and error messages displayed on entering blank credentials.
  - Validate response and error messages displayed on entering invalid emails or wrong passwords.
- **Cross-browser Compatibility**: Functional verification on Chromium, Firefox, and WebKit under Playwright automation.

### Out of Scope
- **Full Signup Flow Execution**: Completing the multi-step "Start a FREE TRIAL" form.
- **Full Password Recovery Flow Execution**: Verifying receipt of reset emails, resetting password via email link, and logging in with the newly reset password.
- **Post-Login Feature Set**: Verifying the internal dashboard, heatmaps, session recordings, or A/B testing workspaces after a successful login.
- **SSO Backend/IdP Configuration**: Setting up or testing third-party identity providers (e.g., Okta, Azure AD) or testing their direct integration servers.
- **Passkey Hardware/Device Registrations**: Operating system or hardware-level registration of passkeys.
- **Performance & Load Testing**: Testing the login rate limits, server load resilience under DDoS or peak logins, and stress tests.
- **Security Penetration Testing**: Full vulnerability scans, API spoofing, session hijacking, or brute-force mitigation beyond simple input sanitization.

## 4. Test Strategy

### Test Approach
- **Automation Tool:** Playwright with @playwright/test
- **Test Type:** End-to-end functional testing
- **Browser:** Chromium, Firefox, WebKit
- **Environment:** Production (app.vwo.com)

### Test Levels
- Smoke Testing (critical paths)
- Functional Testing (all features)
- Negative Testing (invalid inputs, error handling)

## 5. Test Environment

| Component | Details |
|-----------|---------|
| Application URL | https://app.vwo.com |
| Browser | Chromium, Firefox, WebKit |
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

| TC ID | Test Case Title | Category | Priority | Expected Result |
|-------|-----------------|----------|----------|-----------------|
| **TC-LOG-001** | Verify Login page loads successfully with VWO + ABTasty branding | Smoke | High | Page loads successfully, layout matches the mock screenshot, all buttons and fields are visible. |
| **TC-LOG-002** | Verify Login with valid credentials redirects to VWO Dashboard | Smoke | High | Successful authentication; user is redirected to `https://app.vwo.com/v2/#/dashboard`. |
| **TC-LOG-003** | Verify blank email and password form submission validation | Negative | High | Warning message appears stating "Email ID cannot be empty" or similar validation error. No network request for login is triggered unnecessarily. |
| **TC-LOG-004** | Verify invalid email format validation (e.g., "invalid_email") | Negative | High | Appropriate validation error message "Please enter a valid email address" or similar is displayed. |
| **TC-LOG-005** | Verify password visibility toggle shows/hides password text | Functional | Medium | Clicking eye icon changes input type from `password` to `text` (showing password) and clicking it again changes it back to `password`. |
| **TC-LOG-006** | Verify the 'Remember me' checkbox state is selectable | Functional | Medium | Checkbox can be checked/unchecked. If checked, user credentials/session persistence is handled as configured. |
| **TC-LOG-007** | Verify 'Forgot Password?' hyperlink redirects to recovery page | Smoke | Medium | Clicking the link redirects the browser to VWO's password reset/recovery page. |
| **TC-LOG-008** | Verify 'Sign in with Google' button redirects to Google OAuth page | Functional | Medium | Clicking redirects user to standard Google Accounts login flow screen. |
| **TC-LOG-009** | Verify 'Sign in using SSO' button redirects to SSO portal | Functional | Medium | Clicking redirects to SSO login portal inputting enterprise domain. |
| **TC-LOG-010** | Verify 'Sign in with Passkey' triggers browser passkey prompt | Functional | Medium | Clicking attempts to invoke browser/OS-level passkey authentication flow. |
| **TC-LOG-011** | Verify 'Start a FREE TRIAL' button redirects to registration page | Smoke | Medium | Clicking redirects user to the free trial sign-up page (`https://vwo.com/free-trial/`). |
| **TC-LOG-012** | Verify 'Privacy policy' and 'Terms' footer links work | Functional | Low | Links correctly open VWO Privacy Policy and Terms of Service documents. |
| **TC-LOG-013** | Verify page layout responsiveness and rendering on desktop viewports | Functional | Low | Layout scales correctly across typical desktop dimensions (1920x1080, 1440x900, 1280x800) without overlaps. |

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Application downtime | High | Use stable test environment |
| Flaky tests | Medium | Implement proper waits, no retries |
| Environment differences | Medium | Use consistent browser version |

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
