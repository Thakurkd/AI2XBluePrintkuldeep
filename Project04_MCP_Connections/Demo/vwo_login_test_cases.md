# Test Cases: VWO Login Page — International Invalid Login

| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Author** | Antigravity QA AI |
| **Date** | 2026-05-24 |
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

### TC-001: Invalid Login with Chinese Unicode Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-001 |
| **Title** | Verify login fails gracefully with Chinese (Simplified) Unicode email and password |
| **Preconditions** | VWO login page (`https://app.vwo.com`) is accessible. Browser is Chromium launched via Playwright. |
| **Steps** | 1. Navigate to `https://app.vwo.com` <br> 2. Enter `测试用户@vwo.cn` into the "Enter email ID" field <br> 3. Enter `密码123456` into the "Enter password" field <br> 4. Click the "Sign in" button <br> 5. Wait 3 seconds for the server response |
| **Expected Result** | The login attempt fails. An error banner appears with the message: **"Your email, password, IP address or location did not match"**. The user remains on the login page. The application does not crash or display a raw exception. |
| **Actual Result** | ✅ Error banner displayed: "Your email, password, IP address or location did not match". User remains on login page. No crash observed. |
| **Status** | **PASS** |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `tests/international-login.spec.ts` |
| **Screenshot** | `Screenshots/chinese_login.png` |

---

### TC-002: Invalid Login with Arabic Unicode Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-002 |
| **Title** | Verify login fails gracefully with Arabic (RTL script) Unicode email and password |
| **Preconditions** | VWO login page (`https://app.vwo.com`) is accessible. Browser is Chromium launched via Playwright. |
| **Steps** | 1. Navigate to `https://app.vwo.com` <br> 2. Clear any previous input from email and password fields <br> 3. Enter `بريد_عربي@vwo.com` into the "Enter email ID" field <br> 4. Enter `كلمة_المرور123` into the "Enter password" field <br> 5. Click the "Sign in" button <br> 6. Wait 3 seconds for the server response |
| **Expected Result** | The login attempt fails. An error banner appears with the message: **"Your email, password, IP address or location did not match"**. The RTL characters render correctly in the email field without layout corruption. The user remains on the login page. |
| **Actual Result** | ✅ Error banner displayed: "Your email, password, IP address or location did not match". RTL Arabic text rendered correctly in the input field. User remains on login page. No crash observed. |
| **Status** | **PASS** |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `tests/international-login.spec.ts` |
| **Screenshot** | `Screenshots/arabic_login.png` |

---

### TC-003: Invalid Login with German (Umlaut/Eszett) Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-003 |
| **Title** | Verify login fails gracefully with German special characters (ä, ö, ß) in email and password |
| **Preconditions** | VWO login page (`https://app.vwo.com`) is accessible. Browser is Chromium launched via Playwright. |
| **Steps** | 1. Navigate to `https://app.vwo.com` <br> 2. Clear any previous input from email and password fields <br> 3. Enter `nutzä@vwo.de` into the "Enter email ID" field <br> 4. Enter `großesPasswörtß` into the "Enter password" field <br> 5. Click the "Sign in" button <br> 6. Wait 3 seconds for the server response |
| **Expected Result** | The login attempt fails. An error banner appears with the message: **"Your email, password, IP address or location did not match"**. German diacritical characters (ä, ö, ß) are accepted and rendered correctly by the input field. The user remains on the login page. |
| **Actual Result** | ✅ Error banner displayed: "Your email, password, IP address or location did not match". German Umlaut and Eszett characters rendered correctly. User remains on login page. No crash observed. |
| **Status** | **PASS** |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `tests/international-login.spec.ts` |
| **Screenshot** | `Screenshots/german_login.png` |

---

### TC-004: Invalid Login with Indian (Hindi/Devanagari) Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-004 |
| **Title** | Verify login fails gracefully with Hindi Devanagari script email and password |
| **Preconditions** | VWO login page (`https://app.vwo.com`) is accessible. Browser is Chromium launched via Playwright. |
| **Steps** | 1. Navigate to `https://app.vwo.com` <br> 2. Clear any previous input from email and password fields <br> 3. Enter `कुलदीप@vwo.in` into the "Enter email ID" field <br> 4. Enter `पासवर्ड१२३` into the "Enter password" field <br> 5. Click the "Sign in" button <br> 6. Wait 3 seconds for the server response |
| **Expected Result** | The login attempt fails. An error banner appears with the message: **"Your email, password, IP address or location did not match"**. Hindi Devanagari characters render correctly in the input fields. The user remains on the login page. |
| **Actual Result** | ✅ Error banner displayed: "Your email, password, IP address or location did not match". Devanagari script and Hindi numerals (१२३) rendered correctly. User remains on login page. No crash observed. |
| **Status** | **PASS** |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `tests/international-login.spec.ts` |
| **Screenshot** | `Screenshots/indian_login.png` |

---

### TC-005: Invalid Login with Afghanistan (Pashto/Dari) Credentials

| Field | Details |
|-------|---------|
| **TC ID** | TC-005 |
| **Title** | Verify login fails gracefully with Pashto/Dari script (Afghanistan) email and password |
| **Preconditions** | VWO login page (`https://app.vwo.com`) is accessible. Browser is Chromium launched via Playwright. |
| **Steps** | 1. Navigate to `https://app.vwo.com` <br> 2. Clear any previous input from email and password fields <br> 3. Enter `افغان_کارونکی@vwo.af` into the "Enter email ID" field <br> 4. Enter `پٹنوم۱۲۳` into the "Enter password" field <br> 5. Click the "Sign in" button <br> 6. Wait 3 seconds for the server response |
| **Expected Result** | The login attempt fails. An error banner appears with the message: **"Your email, password, IP address or location did not match"**. Pashto/Dari characters and Extended Arabic-Indic digits (۱۲۳) render correctly. The user remains on the login page. |
| **Actual Result** | ✅ Error banner displayed: "Your email, password, IP address or location did not match". Pashto/Dari RTL script and Extended Arabic numerals rendered correctly. User remains on login page. No crash observed. |
| **Status** | **PASS** |
| **Priority** | High |
| **Category** | Negative |
| **Spec File** | `tests/international-login.spec.ts` |
| **Screenshot** | `Screenshots/afghanistan_login.png` |

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

---

## Test Execution Evidence

All test cases were executed live using **Playwright MCP** on **2026-05-24**. Each test involved:
1. Navigating to `https://app.vwo.com`
2. Filling the email and password fields with locale-specific Unicode characters
3. Clicking "Sign in" and waiting for the error response
4. Capturing a viewport screenshot as proof of execution

All screenshots are stored at:
`c:\Users\Kd singh\Desktop\AI2xBlueprint\Project04_MCP_Connections\Screenshots\`

| TC ID | Screenshot File |
|-------|-----------------|
| TC-001 | `chinese_login.png` |
| TC-002 | `arabic_login.png` |
| TC-003 | `german_login.png` |
| TC-004 | `indian_login.png` |
| TC-005 | `afghanistan_login.png` |

### Overall Verdict: ✅ ALL 5 TEST CASES PASSED

The VWO login page correctly handles international Unicode input across Chinese, Arabic, German, Hindi (Indian), and Pashto/Dari (Afghanistan) scripts. In all 5 cases, the application returned a proper error message without crashing, corrupting layout, or exposing raw exceptions.
