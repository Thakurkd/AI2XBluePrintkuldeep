# VWO Login Page - Test Plan

**Feature:** Login Page Authentication  
**Feature URL:** https://app.vwo.com/  
**Version:** 1.0  
**Created:** May 17, 2026  
**Test Lead:** QA Team  

---

## 1. Objective

This test plan outlines the comprehensive testing strategy for the **VWO Login Page** feature. The objective is to validate that:
- Valid credentials successfully authenticate users and redirect to the VWO Dashboard
- Invalid credentials display an error message and user remains on login page
- All authentication methods function correctly (Email/Password, SSO, 2FA, Passkey)
- Security protocols are enforced (TLS encryption, activity logging, RBAC)
- Dashboard response adheres to the 2-second SLA requirement
- User experience is consistent across browsers and devices

---

## 2. Scope

### Features to be Tested (Verified from VWO PRD + login_error.jpg)

**In Scope:**
- Email and password authentication
- SSO (Single Sign-On) sign-in option
- Passkey sign-in option
- Google sign-in option
- reCAPTCHA validation ("I'm not a robot")
- "Remember me" functionality
- "Forgot Password?" link functionality
- Error message handling for invalid credentials
- Error message: "Your email, password, IP address or location did not match"
- Two-factor authentication (2FA) - per PRD
- User session creation and logging per PRD
- TLS encryption for data transmission
- Activity logging per PRD

**Out of Scope:**
- Mobile SDK testing (listed as future enhancement in PRD)
- Password strength policies [NOT SPECIFIED in requirements]
- Account lockout after N failed attempts [NOT SPECIFIED]
- CAPTCHA implementation details [NOT SPECIFIED - only that it exists]
- Email verification workflow [NOT SPECIFIED]
- Account recovery procedures beyond "Forgot Password" button

### Testing Types
- Functional Testing
- Negative Testing
- UI/UX Testing
- Security Testing
- Cross-browser Testing
- Cross-device Testing
- Performance Testing

### Test Environments
- **Production:** https://app.vwo.com/
- **Staging:** [Not specified in PRD - requires clarification]
- **Development:** [Not specified in PRD - requires clarification]

---

## 3. Entry and Exit Criteria

### Entry Criteria
- VWO PRD document approved and baselined
- Application build deployed to test environment
- Test environment infrastructure verified (DNS, SSL certificates)
- Test data (valid/invalid credentials) prepared
- Test tools configured (Selenium, Postman for API calls)
- Cross-browser testing environment ready

### Exit Criteria
- All test cases executed (100% execution rate)
- No Critical/High severity defects open
- Performance requirements met (2-second dashboard SLA)
- Security validations passed
- Cross-browser compatibility confirmed
- Test summary report approved by Project Manager

---

## 4. Test Scenarios (High-Level)

| Scenario # | Scenario Name | Trigger | Expected Outcome |
|-----------|---------------|---------|------------------|
| S1 | Valid Email + Password | User enters correct credentials | Dashboard appears within 2 seconds |
| S2 | Invalid Email | User enters non-existent email | Error message displayed, stays on login page |
| S3 | Invalid Password | Correct email, wrong password | Error message displayed, stays on login page |
| S4 | Valid Email + Incorrect Password | Multiple attempts | Error message: "Your email, password, IP address or location did not match" |
| S5 | Empty Email Field | Form submitted without email | [ASSUMED: Validation error - NOT SPECIFIED] |
| S6 | Empty Password Field | Form submitted without password | [ASSUMED: Validation error - NOT SPECIFIED] |
| S7 | SSO Sign-In | User clicks "Sign in using SSO" | [ASSUMED: Redirects to SSO provider - NOT SPECIFIED] |
| S8 | Google Sign-In | User clicks "Sign in with Google" | [ASSUMED: Redirects to Google OAuth - NOT SPECIFIED] |
| S9 | Passkey Sign-In | User clicks "Sign in with Passkey" | [ASSUMED: Passkey authentication flow - NOT SPECIFIED] |
| S10 | reCAPTCHA Interaction | User interacts with "I'm not a robot" | [ASSUMED: CAPTCHA validation - NOT SPECIFIED] |
| S11 | Remember Me Checked | User logs in with "Remember me" selected | [ASSUMED: Credentials cached - NOT SPECIFIED] |
| S12 | Forgot Password | User clicks "Forgot Password?" link | [ASSUMED: Password reset flow initiated - NOT SPECIFIED] |

---

## 5. Test Data Requirements

| Data Type | Value | Purpose | Source |
|-----------|-------|---------|--------|
| Valid Email | [Approved test account] | Happy path testing | QA Environment |
| Valid Password | [Approved test password] | Happy path testing | QA Environment |
| Invalid Email | invalid@notexist.com | Negative testing | Generated |
| Invalid Password | WrongP@ssw0rd | Negative testing | Generated |
| Email with SQL Injection | admin' OR '1'='1 | Security testing | OWASP |
| Email with XSS | <script>alert('XSS')</script> | Security testing | OWASP |
| Long Email (>254 chars) | [Generated] | Boundary testing | Generated |
| Special Characters | user!@#$%^&*() | Boundary testing | Generated |

---

## 6. Test Environment & Configuration

**Browsers:**
- Google Chrome (latest stable)
- Mozilla Firefox (latest stable)
- Microsoft Edge (latest stable)
- Safari (latest on macOS)

**Operating Systems:**
- Windows 10 / 11
- macOS (latest 2 versions)
- Ubuntu LTS

**Devices:**
- Desktop (1920×1080)
- Laptop (1366×768)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android)

**Network Conditions:**
- Wi-Fi (corporate)
- Cellular (4G/5G)
- Wired (Ethernet)

**Security Setup:**
- TLS 1.2+ required per PRD
- SSL certificate validation enabled
- Activity logging enabled per PRD

---

## 7. Defect Reporting Procedure

**Severity Levels:**
- **Critical:** Login completely broken, security breach, data loss
- **High:** Major functionality broken (e.g., error message not showing), no workaround
- **Medium:** Minor issue (UI alignment), workaround exists
- **Low:** Cosmetic issues, typos

**Required Information per Bug Report:**
- Clear title
- Environment (URL tested)
- Severity & Priority
- Steps to reproduce
- Expected result (from PRD/images)
- Actual result (observed)
- Screenshots/videos
- Browser & OS information
- Network conditions

**Defect Tracking Tool:** JIRA (per PRD guidelines)

---

## 8. Test Execution Strategy

### Phase 1: Smoke Testing (Day 1)
- Verify login page loads without errors
- Can access all sign-in options (Email, SSO, Google, Passkey)
- Page responds within 2 seconds (performance baseline)

### Phase 2: Functional Testing (Days 2-3)
- Execute core test cases for happy path
- Execute negative scenarios
- Validate error messages match specification

### Phase 3: Security & Performance Testing (Day 4)
- SQL/XSS injection attempts
- Invalid input validation
- Performance under load [ASSUMED - not specified]
- TLS encryption validation

### Phase 4: Cross-browser & Cross-device (Day 5)
- Test across 4 browsers minimum
- Test desktop + mobile layouts
- Responsive design validation

### Phase 5: Regression & Sign-Off (Day 6)
- Retest any fixed bugs
- Final validation of all deliverables
- Report generation for PM approval

---

## 9. Performance Requirements

Per VWO PRD:
- Dashboard response: **< 2 seconds**
- TLS encryption in transit: **Required**
- 99.9% uptime SLA: **Required**

**Pass Criteria:**
- Login → Dashboard: ≤ 2.0 seconds (99th percentile)
- Error message display: ≤ 1.0 second
- Page load time: ≤ 1.5 seconds

---

## 10. Security Validations

Per VWO PRD:
- **Authentication:** Email/Password + SSO + 2FA ✓
- **Authorization:** RBAC enforced ✓
- **Encryption in transit:** TLS required ✓
- **Encryption at rest:** [NOT SPECIFIED for session data]
- **Activity logging:** Enabled ✓
- **Input validation:** Required to prevent injection attacks

**Security Test Scenarios:**
- SQL injection on email/password fields
- XSS payload in input fields
- [ASSUMED] Rate limiting on failed attempts
- [ASSUMED] Session timeout policies
- Password transmission encrypted

---

## 11. Roles & Responsibilities

| Role | Responsibility |
|------|-----------------|
| Test Lead | Approve test plan, prioritize issues, sign-off |
| QA Engineers | Execute tests, report bugs, reproduce issues |
| Developers | Fix reported defects, support debugging |
| Project Manager | Track timeline, escalate blockers |
| Security Team | Validate security controls |

---

## 12. Tools & Resources

| Tool | Purpose | Status |
|------|---------|--------|
| Selenium WebDriver | UI automation | Required |
| Postman | API validation | Required |
| Chrome DevTools | Network inspection, TLS validation | Required |
| [Test management tool] | Test case tracking | [NOT SPECIFIED] |
| JIRA | Defect tracking | Required |
| BrowserStack | Cross-browser testing | [ASSUMED] |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SSO/Passkey configuration not available | Blocks testing | Contact DevOps for staging setup, use mock credentials |
| Invalid test credentials | Cannot complete happy path | Prepare verified test accounts in advance |
| SSL certificate issues | Cannot test TLS | Work with security team to validate certificates |
| Staging environment instability | Blocks multiple tests | Have fallback testing approach, coordinate with DevOps |
| Cross-browser tool unavailable | Cannot complete cross-browser testing | Pre-license BrowserStack or similar tool |

---

## 14. Sign-Off & Approval

**Test Plan Approval:** ___________________________  
**Date:** ___________________________  

**Project Manager Sign-Off:** ___________________________  
**Date:** ___________________________  

**Security Lead Sign-Off:** ___________________________  
**Date:** ___________________________  

---

## Appendix A: References

- VWO PRD: context_brain/vwo_prd.md
- Login Screenshots: Inputs/login_error.jpg, Inputs/TheTestingAcademy.jpg
- Anti-Hallucination Rules: Antihallucinations/anti_hallucination_rules.md
- Test Case Templates: PromptTemplates/ch_02_test_case_prompts.md

---

## Appendix B: Assumptions & Clarifications Needed

| Item | Assumption | Clarification Needed |
|------|-----------|----------------------|
| Failed login lockout | No limit specified | How many failed attempts before lockout? |
| Session timeout | Not specified | How long before session expires? |
| 2FA flow | Exists in PRD | What 2FA methods supported? SMS, TOTP, email? |
| Password policy | Not specified | Min length? Special characters? Expiry? |
| Staging/Dev URL | Not specified | What are staging & development URLs? |
| API error codes | Not documented | What specific error codes for invalid credentials? |

---

**Document Status:** Ready for QA Execution  
**Last Updated:** May 17, 2026
