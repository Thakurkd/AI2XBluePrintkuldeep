# Test Cases: VWO Login Page

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | QA Team |
| **Date** | 2026-03-17 |
| **Total Test Cases** | 5 |

---

## Test Case Format

Each test case follows this structure:

| Field | Description |
|-------|-------------|
| **TC ID** | Unique identifier (TC-001, TC-002, ...) |
| **Title** | Brief description of what is tested |
| **Preconditions** | What must be true before the test |
| **Steps** | Step-by-step instructions |
| **Expected Result** | What should happen |
| **Priority** | High / Medium / Low |
| **Category** | Smoke / Functional / Negative |
| **Spec File** | Corresponding Playwright spec file |

---

## Test Cases

### TC-001: Arabic Login with Invalid Credentials

| Field | Description |
|-------|-------------|
| **TC ID** | TC-001 |
| **Title** | Verify authentication failure when using Arabic characters for email |
| **Preconditions** | User must be on the VWO login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter an invalid Arabic email address (e.g., `اختبار@gmail.com`) in the "Email address" field.<br>2. Enter any dummy password in the "Password" field.<br>3. Click the "Sign in" button. |
| **Expected Result** | The login should fail, and an error message displaying `Your email, password, IP address or location did not match` should be clearly shown. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.negative.spec.ts` |

### TC-002: Chinese Login with Invalid Credentials

| Field | Description |
|-------|-------------|
| **TC ID** | TC-002 |
| **Title** | Verify authentication failure when using Chinese characters for email |
| **Preconditions** | User must be on the VWO login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter an invalid Chinese email address (e.g., `测试@gmail.com`) in the "Email address" field.<br>2. Enter any dummy password in the "Password" field.<br>3. Click the "Sign in" button. |
| **Expected Result** | The login should fail, and an error message displaying `Your email, password, IP address or location did not match` should be clearly shown. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.negative.spec.ts` |

### TC-003: Dummy Standard Login with Invalid Credentials

| Field | Description |
|-------|-------------|
| **TC ID** | TC-003 |
| **Title** | Verify authentication failure with a dummy unregistered email address |
| **Preconditions** | User must be on the VWO login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter a standard dummy email address (e.g., `dummy@dummy.com`) in the "Email address" field.<br>2. Enter an incorrect password (e.g., `password123`).<br>3. Click the "Sign in" button. |
| **Expected Result** | System should reject the credentials and display the error `Your email, password, IP address or location did not match`. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.negative.spec.ts` |

### TC-004: Invalid Format Email Address Login

| Field | Description |
|-------|-------------|
| **TC ID** | TC-004 |
| **Title** | Verify authentication failure with an incorrectly formatted email address |
| **Preconditions** | User must be on the VWO login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Enter an email address without an '@' symbol (e.g., `testing123`) in the "Email address" field.<br>2. Enter a password.<br>3. Click the "Sign in" button. |
| **Expected Result** | The server/frontend should reject the input and an error message displaying `Your email, password, IP address or location did not match` (or a respective inline validation error) should be visible. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.negative.spec.ts` |

### TC-005: Empty Fields Login attempt

| Field | Description |
|-------|-------------|
| **TC ID** | TC-005 |
| **Title** | Verify login restriction when submitting completely empty credentials |
| **Preconditions** | User must be on the VWO login page (https://app.vwo.com/#/login) |
| **Steps** | 1. Leave the "Email address" field empty.<br>2. Leave the "Password" field empty.<br>3. Click the "Sign in" button. |
| **Expected Result** | Login should not proceed, and inline validation indicating that the fields are required should prevent the request from being sent. |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `login.negative.spec.ts` |

---

## Summary

| Priority | Count |
|----------|-------|
| High | 5 |
| Medium | 0 |
| Low | 0 |
| **Total** | **5** |

| Category | Count |
|----------|-------|
| Smoke | 0 |
| Functional | 0 |
| Negative | 5 |
