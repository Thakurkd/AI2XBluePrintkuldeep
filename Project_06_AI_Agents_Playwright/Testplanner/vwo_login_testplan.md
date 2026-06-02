# Test Plan for VWO (Visual Website Optimizer) – Login Page

**Created by:** AI Test Planner Agent
**Date:** 2026-06-02

---

# 1. Objective

The objective of this test plan is to validate the functionality, usability, security, and reliability of the VWO (Visual Website Optimizer) Login Page at https://app.vwo.com. This plan ensures that all authentication flows — including valid login, invalid credentials, password recovery, and edge-case handling — behave as expected across supported environments. The goal is to prevent regressions, confirm correct error feedback to users, and verify that the login page meets both functional requirements and security best practices.

---

# 2. Scope

This test plan covers the following features and areas observed on the VWO login page:

- Email/Username input field
- Password input field (masked text, toggle visibility if present)
- "Log In" / "Sign In" submit button
- "Forgot Password?" link and password reset flow
- "Remember Me" checkbox (if present)
- Google SSO / Single Sign-On (SSO) login option
- Form field validations (empty fields, invalid email format, incorrect password)
- Account lockout behavior after repeated failed login attempts
- Error message display and content
- Page loading states and branding (VWO logo)
- Redirect behavior after successful login
- Keyboard accessibility and tab order
- UI/UX consistency (placeholder text, button states, responsive layout)
- Cross-browser compatibility
- HTTPS enforcement and security headers

---

# 3. Inclusions

The following items are explicitly included in the scope of testing:

1. Functional testing of all login form elements
2. Positive/happy-path login with valid registered credentials
3. Negative testing with invalid email formats, wrong passwords, and empty submissions
4. Boundary testing on input field character limits
5. Password recovery / "Forgot Password" workflow
6. Social/SSO login button visibility and navigation trigger
7. Session management — successful login redirects to the correct dashboard
8. UI validation — correct placeholder text, button labels, and error messaging
9. Account lockout after N consecutive failed login attempts (security behavior)
10. Accessibility checks — keyboard navigation, ARIA labels, tab order
11. Cross-browser testing on Chrome, Firefox, Edge, and Safari
12. Responsive/mobile viewport behavior
13. HTTPS enforcement (HTTP should redirect to HTTPS)

---

# 4. Exclusions

The following items are out of scope for this test plan:

1. Post-login features (dashboards, campaigns, A/B test management)
2. Account registration / sign-up flow
3. Billing and subscription management pages
4. VWO SmartCode or snippet integration testing
5. API-level authentication (OAuth tokens, API keys)
6. Backend database or server infrastructure testing
7. Load/performance/stress testing beyond standard login flows
8. Penetration testing or security auditing beyond basic checks
9. Email delivery testing for password reset emails (infrastructure side)
10. Third-party SSO provider internals (Google's own login UI)

---

# 5. Test Environments

| Environment        | Details                                              |
|--------------------|------------------------------------------------------|
| Application URL    | https://app.vwo.com                                  |
| Environment Type   | Production / Staging (mirror)                        |
| Browsers           | Google Chrome (latest), Mozilla Firefox (latest), Microsoft Edge (latest), Safari (latest on macOS) |
| Operating Systems  | Windows 11, macOS Ventura, Ubuntu 22.04              |
| Mobile Viewports   | iPhone 14 (Safari), Samsung Galaxy S23 (Chrome)      |
| Screen Resolutions | 1920x1080, 1366x768, 375x812 (mobile)               |
| Network Conditions | Standard broadband; throttled 3G (for load checks)  |
| Test Accounts      | Dedicated QA test accounts (valid, locked, unverified) |
| Tools              | Playwright (Node.js), VS Code, GitHub Actions CI     |

---

# 6. Defect Reporting Procedure

1. **Detection:** Any test case failure is captured with a screenshot, the Playwright trace file, and the console error log.
2. **Logging:** Defects are logged in the project issue tracker (e.g., Jira/GitHub Issues) with the following fields:
   - Title (concise description)
   - Steps to reproduce
   - Expected result
   - Actual result
   - Severity (Critical / High / Medium / Low)
   - Priority
   - Environment (browser, OS, viewport)
   - Attachments (screenshot, video, trace)
3. **Severity Definitions:**
   - **Critical:** Login is completely broken; users cannot authenticate
   - **High:** Core validation is missing or incorrect; security concern exists
   - **Medium:** Non-blocking UI/UX issues; minor incorrect error messages
   - **Low:** Cosmetic issues, minor text typos, alignment
4. **Triage:** Defects are reviewed in the next sprint planning or immediate triage for Critical/High.
5. **Verification:** Fixed defects are re-tested by the QA engineer who raised them before closure.
6. **Closure:** Defect is closed once the fix is verified in the target environment.

---

# 7. Test Strategy

## Step 1: Test Scenarios and Test Cases Creation

---

### Scenario 1: Valid Login – Happy Path

**Pre-conditions:**
- User has a valid, active VWO account
- User is on https://app.vwo.com (not already logged in)
- Browser has no cached session

**Steps:**
1. Navigate to https://app.vwo.com
2. Observe the login page loads with VWO branding, email field, password field, and login button
3. Enter a valid registered email address into the Email field
4. Enter the corresponding valid password into the Password field
5. Click the "Log In" button

**Expected Result:**
- The login form is submitted successfully
- The user is redirected to the VWO dashboard/home page
- No error messages are displayed
- The browser URL changes to the authenticated application route
- The user's account name or avatar appears in the dashboard header

---

### Scenario 2: Invalid Email Format

**Pre-conditions:**
- User is on the VWO login page
- No active session exists

**Steps:**
1. Navigate to https://app.vwo.com
2. Click into the Email field
3. Type a string without "@" symbol (e.g., `invalidemail.com`)
4. Click the Password field or attempt to submit
5. Alternatively, type `invalid@` (incomplete domain)
6. Attempt to click "Log In"

**Expected Result:**
- An inline validation error appears near the Email field (e.g., "Please enter a valid email address")
- The form is NOT submitted
- The user remains on the login page
- The error message is visible, readable, and associated with the email field

---

### Scenario 3: Wrong Password

**Pre-conditions:**
- User has a valid, active VWO account
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter a valid registered email address
3. Enter an incorrect password (e.g., `WrongPass123!`)
4. Click the "Log In" button

**Expected Result:**
- An error message is displayed (e.g., "Invalid email or password" or "Incorrect credentials")
- The error does NOT specify which field is wrong (security best practice — no enumeration)
- The password field is cleared or remains editable
- The user remains on the login page
- No redirect occurs

---

### Scenario 4: Empty Email Field Submission

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Leave the Email field completely empty
3. Enter any text in the Password field
4. Click "Log In"

**Expected Result:**
- A validation error appears on the Email field (e.g., "Email is required" or "This field is required")
- The form is NOT submitted
- Focus is moved to the Email field

---

### Scenario 5: Empty Password Field Submission

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter a valid email address in the Email field
3. Leave the Password field empty
4. Click "Log In"

**Expected Result:**
- A validation error appears on the Password field (e.g., "Password is required")
- The form is NOT submitted
- The user remains on the login page

---

### Scenario 6: Both Fields Empty Submission

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Leave both Email and Password fields empty
3. Click "Log In"

**Expected Result:**
- Validation errors appear on both fields simultaneously
- The form is NOT submitted
- Both error messages are visible and clear

---

### Scenario 7: Forgot Password Flow

**Pre-conditions:**
- User is on the login page
- User has a valid registered email

**Steps:**
1. Navigate to https://app.vwo.com
2. Click the "Forgot Password?" link
3. Observe navigation to the password reset page
4. Enter the registered email address
5. Click "Send Reset Link" (or equivalent button)
6. Check the registered email inbox for a reset email

**Expected Result:**
- Clicking "Forgot Password?" navigates to a password reset form
- The reset form contains an email field and a submit button
- After submitting a valid email, a success message appears (e.g., "If this email is registered, you'll receive a reset link shortly")
- A password reset email is delivered to the registered inbox
- The reset link in the email is functional and navigates to a new password form

---

### Scenario 8: Forgot Password with Unregistered Email

**Pre-conditions:**
- User is on the password reset page

**Steps:**
1. Navigate to the Forgot Password page via the link on login
2. Enter an email that is NOT registered with VWO (e.g., `notregistered@example.com`)
3. Click "Send Reset Link"

**Expected Result:**
- The same generic success message is shown as with a valid email (e.g., "If this email is registered, you'll receive a reset link shortly")
- The system does NOT reveal whether the email exists in the database (prevents user enumeration)
- No actual email is sent

---

### Scenario 9: Remember Me Checkbox (If Present)

**Pre-conditions:**
- A "Remember Me" checkbox is visible on the login page
- User has valid credentials

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter valid email and password
3. Check the "Remember Me" checkbox
4. Click "Log In"
5. Close the browser
6. Reopen the browser and navigate to https://app.vwo.com

**Expected Result:**
- After reopening, the user is still logged in without needing to re-enter credentials
- The session persists across browser restarts

**Steps (unchecked):**
1. Repeat above WITHOUT checking "Remember Me"
2. Close and reopen the browser

**Expected Result:**
- The user is NOT automatically logged in; the login page is shown

---

### Scenario 10: Google SSO / Social Login

**Pre-conditions:**
- A "Continue with Google" or SSO login button is visible on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Click "Continue with Google" (or the SSO button)
3. Observe the redirect

**Expected Result:**
- Clicking the button redirects the user to Google's OAuth consent page
- The OAuth page shows VWO as the requesting application
- Upon granting consent with a Google account linked to VWO, the user is redirected back and logged into VWO
- If the Google account is NOT linked, an appropriate error or sign-up prompt is shown

---

### Scenario 11: Account Lockout After Multiple Failed Attempts

**Pre-conditions:**
- User has a valid VWO account
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter the valid email address
3. Enter an incorrect password
4. Click "Log In" — note the error
5. Repeat steps 3–4 five or more times (use the threshold defined by VWO's policy)
6. On the final attempt, enter the correct password and click "Log In"

**Expected Result:**
- After N consecutive failed attempts (e.g., 5), an account lockout message is shown (e.g., "Your account has been temporarily locked due to too many failed login attempts")
- The user cannot log in even with the correct password while locked out
- An unlock email is sent to the registered email address (if applicable)
- The lockout is time-limited (e.g., 15 minutes) or requires manual unlock via email

---

### Scenario 12: Password Visibility Toggle

**Pre-conditions:**
- A password visibility toggle icon (eye icon) is present in the Password field

**Steps:**
1. Navigate to https://app.vwo.com
2. Click into the Password field and type a password
3. Click the eye icon / visibility toggle

**Expected Result:**
- The password text becomes visible (input type changes from `password` to `text`)
- Clicking the toggle again hides the password again
- The toggle icon changes state visually (open eye vs. closed eye)

---

### Scenario 13: UI/UX Checks – Placeholder Text and Labels

**Pre-conditions:**
- User is on the login page with no input entered

**Steps:**
1. Navigate to https://app.vwo.com
2. Observe the Email field without clicking it
3. Observe the Password field without clicking it
4. Observe the "Log In" button state
5. Check that the VWO logo is visible
6. Check for any footer links (Privacy Policy, Terms of Service, Help)

**Expected Result:**
- Email field shows placeholder text (e.g., "Email" or "Enter your email")
- Password field shows placeholder text (e.g., "Password" or "Enter your password")
- The "Log In" button is clearly labeled and styled as the primary action
- VWO logo is rendered correctly in the header
- Page title in browser tab reads "VWO" or "Log In – VWO"
- Footer contains links to Privacy Policy, Terms of Service, and/or Help/Support

---

### Scenario 14: SQL Injection Attempt in Login Fields

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter `' OR '1'='1` in the Email field
3. Enter `' OR '1'='1` in the Password field
4. Click "Log In"

**Expected Result:**
- The login attempt fails with a standard "Invalid email or password" error
- No database error messages or stack traces are exposed
- The application does not authenticate the user

---

### Scenario 15: XSS Attempt in Login Fields

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Enter `<script>alert('XSS')</script>` in the Email field
3. Click "Log In"

**Expected Result:**
- The script tag is NOT executed
- No alert dialog appears
- The input is either rejected with a validation error or sanitized
- The page remains stable with no script execution

---

### Scenario 16: Keyboard Navigation and Accessibility

**Pre-conditions:**
- User is on the login page

**Steps:**
1. Navigate to https://app.vwo.com
2. Press Tab from the browser address bar
3. Continue pressing Tab through all interactive elements
4. Press Shift+Tab to navigate in reverse
5. Use Enter key to activate the focused "Log In" button

**Expected Result:**
- Tab order is logical: Email field → Password field → Log In button → Forgot Password → Remember Me (if present) → SSO links
- Each interactive element receives visible focus styling (outline or highlight)
- Pressing Enter while focused on the submit button submits the form
- Screen reader users can identify each field by its label (ARIA labels present)

---

### Scenario 17: Login Page on Mobile Viewport

**Pre-conditions:**
- Testing on a mobile device or browser DevTools set to 375x812 (iPhone)

**Steps:**
1. Navigate to https://app.vwo.com on a mobile browser (or DevTools responsive mode)
2. Observe the layout of all elements
3. Tap the Email field and type an email
4. Tap the Password field and type a password
5. Tap the "Log In" button

**Expected Result:**
- The login form is fully visible without horizontal scrolling
- Input fields are touch-friendly (large enough tap targets, minimum 44x44px)
- The virtual keyboard appears when tapping input fields
- Email field triggers the email keyboard layout (@ key visible)
- Password field masks input
- Login button is fully tappable and submits correctly
- No elements overlap or are cut off

---

### Scenario 18: HTTPS Enforcement

**Pre-conditions:**
- Tester has access to attempt HTTP navigation

**Steps:**
1. Type `http://app.vwo.com` in the browser address bar (without HTTPS)
2. Press Enter

**Expected Result:**
- The browser is automatically redirected to `https://app.vwo.com`
- A valid SSL/TLS certificate is present (no browser security warnings)
- The URL in the address bar shows `https://`

---

### Scenario 19: Cross-Browser Consistency

**Pre-conditions:**
- Test accounts and environments set up for each browser

**Steps:**
1. Run Scenarios 1, 2, 3, 13 on Google Chrome (latest)
2. Run the same scenarios on Mozilla Firefox (latest)
3. Run on Microsoft Edge (latest)
4. Run on Safari (latest, macOS)

**Expected Result:**
- Login page renders identically across all browsers
- All functional scenarios pass on every browser
- No browser-specific rendering bugs (font issues, button alignment, etc.)

---

### Scenario 20: Session Expiry and Re-Login

**Pre-conditions:**
- User is logged in to VWO

**Steps:**
1. Log in successfully to VWO
2. Leave the session idle for the session timeout duration (e.g., 30 minutes)
3. Attempt to interact with the application

**Expected Result:**
- The user is automatically logged out after the session expires
- The user is redirected back to the login page
- A message may appear (e.g., "Your session has expired. Please log in again.")
- Previously entered data is not retained in the login form for security

---

## Step 2: Testing Procedure

1. **Environment Setup:**
   - Install Node.js (v18+) and Playwright (`npm install @playwright/test`)
   - Configure test credentials in environment variables (never hardcode in test files)
   - Set up `.env` file with `VWO_EMAIL`, `VWO_PASSWORD`, `VWO_LOCKED_EMAIL` variables

2. **Test Execution Order:**
   - Run UI/UX and smoke checks first (Scenarios 13, 18)
   - Run happy path (Scenario 1)
   - Run validation/negative tests (Scenarios 2–6)
   - Run security tests (Scenarios 11, 14, 15)
   - Run accessibility and cross-browser tests (Scenarios 16, 19)
   - Run mobile viewport tests (Scenario 17)

3. **Automation Approach:**
   - Use Playwright's `page.goto()`, `page.fill()`, `page.click()`, and `page.locator()` for interactions
   - Use `expect(locator).toBeVisible()`, `toHaveText()`, `toHaveURL()` for assertions
   - Capture screenshots on test failure using Playwright's `screenshot: 'only-on-failure'` config
   - Generate HTML test reports using `reporter: 'html'`

4. **Manual Testing:**
   - Scenarios requiring email inbox checking (Scenarios 7, 8, 11) are verified manually
   - Visual/aesthetic UI checks are supplemented with manual review
   - SSO login flow (Scenario 10) may require manual verification on first run

5. **Regression Runs:**
   - Full suite runs on every pull request via CI/CD (GitHub Actions)
   - Smoke subset (Scenarios 1, 2, 3, 13) runs on every deployment to staging

---

## Step 3: Best Practices

1. **Test Isolation:** Each test starts from a clean state — no shared session or browser storage between tests. Use `storageState` clearing in `beforeEach`.

2. **No Hardcoded Credentials:** All test credentials must be stored in environment variables or a secrets manager.

3. **Descriptive Test Names:** Test names must clearly describe the scenario (e.g., `"should show error when password is incorrect"`).

4. **Wait for Network Idle:** After form submission, use `waitForLoadState('networkidle')` or `waitForURL()` to avoid flaky timing issues.

5. **Locator Strategy:** Prefer semantic locators (`getByRole('button', { name: 'Log In' })`, `getByLabel('Email')`) over CSS selectors for resilience and accessibility alignment.

6. **Error Screenshots:** Always capture a screenshot and trace file on failure for faster debugging.

7. **Parallel Execution:** Run browser-specific tests in parallel using Playwright projects config to reduce total run time.

8. **Sensitive Data Masking:** Do not log or print credentials in test output. Mask environment variables in CI logs.

9. **Re-try on Flakiness:** Set `retries: 1` in CI to auto-retry genuinely flaky tests, but investigate and fix root causes promptly.

10. **Accessibility Assertions:** Use `@axe-core/playwright` to automate WCAG accessibility checks on the login page as part of the test suite.

---

# 8. Test Schedule

| Phase                        | Activity                                          | Duration     | Target Date  |
|------------------------------|---------------------------------------------------|--------------|--------------|
| Phase 1: Planning            | Test plan creation and review                     | 1 day        | 2026-06-02   |
| Phase 2: Environment Setup   | Configure Playwright, test accounts, CI pipeline  | 1 day        | 2026-06-03   |
| Phase 3: Test Case Authoring | Write and review Playwright test scripts          | 2 days       | 2026-06-04 – 2026-06-05 |
| Phase 4: Execution – Smoke   | Run smoke tests (happy path, critical validation) | 0.5 day      | 2026-06-06   |
| Phase 5: Execution – Full    | Run full test suite across all scenarios          | 1 day        | 2026-06-09   |
| Phase 6: Cross-Browser       | Execute on Firefox, Edge, Safari                  | 1 day        | 2026-06-10   |
| Phase 7: Mobile Testing      | Mobile viewport and touch interaction tests       | 0.5 day      | 2026-06-11   |
| Phase 8: Defect Re-testing   | Verify fixed defects, run regression              | 1 day        | 2026-06-12   |
| Phase 9: Sign-Off            | Final test report, approval, and closure          | 0.5 day      | 2026-06-13   |

---

# 9. Test Deliverables

| Deliverable                  | Description                                               | Format          |
|------------------------------|-----------------------------------------------------------|-----------------|
| Test Plan                    | This document                                             | Markdown (.md)  |
| Test Scripts                 | Automated Playwright test files                           | TypeScript (.ts)|
| Test Execution Report        | Playwright HTML report with pass/fail status per scenario | HTML            |
| Defect Report                | List of all identified defects with severity and status   | Jira / CSV      |
| Screenshots/Traces           | Captured on every test failure                            | PNG / ZIP       |
| Coverage Summary             | Mapping of scenarios to pass/fail results                 | Markdown / CSV  |
| Final Sign-Off Document      | Approval confirmation with exit criteria verification     | PDF / Email     |

---

# 10. Entry and Exit Criteria

## Entry Criteria (Testing can begin when):
- [ ] The VWO login page is deployed and accessible at https://app.vwo.com
- [ ] Test environment credentials (valid, invalid, locked accounts) are provisioned
- [ ] Playwright is installed and the test project is configured
- [ ] The test plan has been reviewed and approved by the QA lead
- [ ] All test data is available (email accounts for SSO, password reset testing)

## Exit Criteria (Testing is complete when):
- [ ] All 20 test scenarios have been executed at least once
- [ ] 100% of Critical and High severity defects are resolved and verified
- [ ] No open Critical defects remain
- [ ] Test pass rate is >= 95% across all scenarios
- [ ] Cross-browser tests pass on Chrome, Firefox, Edge, and Safari
- [ ] Mobile viewport tests pass on at least one iOS and one Android viewport
- [ ] The final test report has been generated and shared with stakeholders
- [ ] Approval sign-off is obtained from the QA lead and product owner

---

# 11. Tools

| Tool                   | Purpose                                               | Version      |
|------------------------|-------------------------------------------------------|--------------|
| Playwright             | Browser automation and E2E test execution             | v1.44+       |
| Node.js                | Runtime for Playwright tests                          | v18+         |
| TypeScript             | Test scripting language for type safety               | v5+          |
| @axe-core/playwright   | Automated accessibility (WCAG) checks                 | Latest       |
| GitHub Actions         | CI/CD pipeline for automated test runs on PR          | N/A          |
| VS Code                | IDE for test development                              | Latest       |
| dotenv                 | Manage test credentials via environment variables     | Latest       |
| Playwright HTML Reporter | Generate visual test execution reports              | Built-in     |
| Playwright Trace Viewer | Debug test failures with recorded traces             | Built-in     |
| Jira / GitHub Issues   | Defect tracking and management                        | Cloud        |

---

# 12. Risks and Mitigations

| Risk                                                           | Likelihood | Impact   | Mitigation Strategy                                                                 |
|----------------------------------------------------------------|------------|----------|-------------------------------------------------------------------------------------|
| Test account credentials expire or get locked during testing   | Medium     | High     | Provision dedicated QA accounts; automate account unlock via API if available       |
| VWO introduces CAPTCHA on repeated failed login attempts       | Medium     | High     | Use Playwright stealth mode; test CAPTCHA scenarios manually; mock CAPTCHA in staging |
| SSO (Google) login requires live Google account interaction    | High       | Medium   | Test SSO trigger (button click, redirect) automatically; complete OAuth flow manually |
| Page structure changes break locators                          | Medium     | High     | Use semantic/ARIA locators (`getByRole`, `getByLabel`) over fragile CSS selectors   |
| Network latency causes timing issues in CI                     | Medium     | Medium   | Use `waitForLoadState`, `waitForURL`, and retry logic; increase timeouts in CI      |
| Rate limiting by VWO blocks automated test runs               | Low        | High     | Use test-specific accounts; throttle test execution; coordinate with VWO if needed  |
| Cross-browser rendering differences are not caught by automation | Low      | Medium   | Supplement with manual visual inspection; consider Percy or Chromatic for visual diffs |
| Password reset emails delayed or filtered as spam             | Medium     | Medium   | Use a dedicated QA email inbox; whitelist VWO sender; test with manual checks       |
| Mobile real-device behavior differs from emulation             | Low        | Low      | Supplement DevTools emulation with real-device testing on BrowserStack / Sauce Labs  |
| VWO deploys changes to login page mid-test-cycle              | Low        | Medium   | Freeze the test environment to a staging build during active test cycles            |

---

# 13. Approvals

| Role                  | Name                  | Signature / Approval     | Date         |
|-----------------------|-----------------------|--------------------------|--------------|
| QA Lead               | [QA Lead Name]        | Pending                  | 2026-06-02   |
| Product Owner         | [Product Owner Name]  | Pending                  | 2026-06-02   |
| Development Lead      | [Dev Lead Name]       | Pending                  | 2026-06-02   |
| Test Manager          | [Test Manager Name]   | Pending                  | 2026-06-02   |

---

*This test plan was generated by the AI Test Planner Agent on 2026-06-02 for the VWO Login Page at https://app.vwo.com. It should be reviewed and adapted by the QA team before execution to incorporate any environment-specific constraints or updated UI observations.*
