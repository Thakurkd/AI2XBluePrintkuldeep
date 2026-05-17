# VWO Login Page - Test Cases

**Feature:** Login Page Authentication  
**Version:** 1.0  
**Date:** May 17, 2026  
**Total Test Cases:** 30  
**Coverage:** Functional, Negative, Security, Cross-browser  

---

## TEST CASE FORMAT

| TID | Category | Description | Pre-conditions | Steps | Expected Result | Priority |

---

## HAPPY PATH / POSITIVE TEST CASES

### TC001: Valid Login - Email and Password
| TID | TC001 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify user can successfully login with valid email and password |
| **Trace to PRD** | Section "Authentication" - Email + password support |
| **Pre-conditions** | 1. User account exists with active status<br>2. Valid email: testuser@vwo.com (test data)<br>3. Valid password: Test@123Secure (test data)<br>4. Browser: Chrome latest<br>5. Page: https://app.vwo.com/ loaded |
| **Steps** | 1. Enter email: testuser@vwo.com in "Enter email ID" field<br>2. Enter password: Test@123Secure in "Enter password" field<br>3. Verify reCAPTCHA checkbox accessible<br>4. Click reCAPTCHA if required<br>5. Click "Sign in" button<br>6. Wait for page response |
| **Expected Result** | ✓ Email accepted<br>✓ Password accepted<br>✓ reCAPTCHA validated<br>✓ User redirected to VWO Dashboard<br>✓ Dashboard loads within 2 seconds (per PRD SLA)<br>✓ No error message displayed<br>✓ Session established with appropriate RBAC role |
| **Priority** | **CRITICAL** |

---

### TC002: Valid Login - Check Remember Me Persistence
| TID | TC002 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify "Remember me" checkbox functions and maintains session |
| **Trace to PRD** | UI element visible on login_error.jpg |
| **Pre-conditions** | 1. User account active<br>2. Valid credentials prepared<br>3. Login page loaded<br>4. [ASSUMED] Remember me feature active |
| **Steps** | 1. Enter valid email: testuser@vwo.com<br>2. Enter valid password: Test@123Secure<br>3. CHECK the "Remember me" checkbox<br>4. Click reCAPTCHA if required<br>5. Click "Sign in" button<br>6. Verify Dashboard loads<br>7. Close browser completely<br>8. Reopen browser and navigate to app.vwo.com |
| **Expected Result** | ✓ Checkbox checked successfully<br>✓ First login succeeds, Dashboard appears<br>✓ After browser close/reopen, [ASSUMED: User remains logged in OR can skip re-login]<br>✓ Session persisted [ASSUMED - NOT SPECIFIED how long] |
| **Priority** | **MEDIUM** |
| **Note** | [ASSUMED] Remember me extends session duration - implementation not specified in PRD |

---

### TC003: SSO Sign-In Option Available
| TID | TC003 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify SSO sign-in button is present and clickable |
| **Trace to PRD** | Section "Authentication" - SSO support |
| **Pre-conditions** | 1. Login page loaded (https://app.vwo.com/)<br>2. User has SSO account configured<br>3. SSO provider accessible<br>4. Chrome browser |
| **Steps** | 1. Locate "Sign in using SSO" button on login page<br>2. Verify button is visible and enabled<br>3. Click "Sign in using SSO" button<br>4. Observe page behavior |
| **Expected Result** | ✓ Button visible and properly styled<br>✓ Button clickable (no JavaScript errors)<br>✓ [ASSUMED: Redirects to SSO provider login page]<br>✓ User can complete SSO authentication flow |
| **Priority** | **HIGH** |
| **Note** | [ASSUMED] SSO provider configuration - endpoint and method not specified |

---

### TC004: Google Sign-In Option Available
| TID | TC004 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify "Sign in with Google" button is present and functional |
| **Trace to PRD** | Visible on UI (login_error.jpg) - no explicit PRD mention |
| **Pre-conditions** | 1. Login page loaded<br>2. User has Google account<br>3. User's Google account linked to VWO (if required)<br>4. Internet connectivity active |
| **Steps** | 1. Locate "Sign in with Google" button<br>2. Verify button displays Google logo<br>3. Click button<br>4. Observe browser behavior |
| **Expected Result** | ✓ Button visible with Google branding<br>✓ Button clickable<br>✓ [ASSUMED: Google OAuth popup/redirect triggered]<br>✓ User directed to Google login if not already signed in |
| **Priority** | **HIGH** |
| **Note** | [ASSUMED] Google OAuth 2.0 implementation |

---

### TC005: Passkey Sign-In Option Available
| TID | TC005 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify "Sign in with Passkey" button is present and accessible |
| **Trace to PRD** | UI element visible (login_error.jpg) - PRD does not detail passkey support |
| **Pre-conditions** | 1. Login page loaded<br>2. User has registered a passkey<br>3. Browser supports WebAuthn (Chrome, Edge, Safari) |
| **Steps** | 1. Locate "Sign in with Passkey" button<br>2. Verify button visible and enabled<br>3. Click button<br>4. Observe system prompt for passkey |
| **Expected Result** | ✓ Button visible and functional<br>✓ Clicking triggers passkey authentication<br>✓ OS passkey dialog appears (fingerprint, face scan, PIN, etc.)<br>✓ [ASSUMED] After authentication, user redirected to Dashboard |
| **Priority** | **MEDIUM** |
| **Note** | [ASSUMED] WebAuthn/FIDO2 implementation - not specified in PRD |

---

### TC006: 2FA (Two-Factor Authentication) - OTP Verification
| TID | TC006 |
|-----|-------|
| **Category** | Functional - Happy Path |
| **Description** | Verify 2FA OTP prompt appears after valid email/password and user can authenticate |
| **Trace to PRD** | Section "Authentication" - Two-factor authentication (2FA) support |
| **Pre-conditions** | 1. User account with 2FA enabled<br>2. Valid email and password<br>3. 2FA delivery method configured (SMS/email/app [ASSUMED])<br>4. Can receive OTP within timeout period |
| **Steps** | 1. Enter valid email: testuser2fa@vwo.com<br>2. Enter valid password: Test@123Secure<br>3. Click reCAPTCHA if required<br>4. Click "Sign in" button<br>5. Wait for OTP prompt/screen<br>6. Receive OTP (SMS/email/app [ASSUMED])<br>7. Enter OTP into prompt<br>8. Click verify/submit |
| **Expected Result** | ✓ Valid credentials accepted<br>✓ 2FA verification prompt displayed<br>✓ OTP successfully delivered [ASSUMED timeframe not specified]<br>✓ OTP accepted after entry<br>✓ User authenticated and redirected to Dashboard<br>✓ Session created with 2FA verification logged |
| **Priority** | **HIGH** |
| **Note** | [ASSUMED] 2FA methods (SMS, TOTP, email) - delivery mechanism not specified |

---

### TC007: Dashboard Loads Within 2-Second SLA
| TID | TC007 |
|-----|-------|
| **Category** | Performance |
| **Description** | Verify Dashboard response time meets 2-second requirement per PRD |
| **Trace to PRD** | Section "Performance Requirements" - "Dashboard... respond within 2 seconds" |
| **Pre-conditions** | 1. Valid credentials ready<br>2. User logged in successfully<br>3. Network speed: normal (Wi-Fi)<br>4. Browser developer tools open (Network tab) |
| **Steps** | 1. Note time before clicking "Sign in"<br>2. Enter valid credentials<br>3. Click "Sign in" button<br>4. Measure time until Dashboard fully interactive<br>5. Use Network tab to confirm all critical assets loaded |
| **Expected Result** | ✓ Login form submits within 0.5s<br>✓ Dashboard appears within 2.0 seconds (99th percentile)<br>✓ DOM fully rendered<br>✓ Page interactive (buttons clickable)<br>✓ No resources pending (CSS, JS, images loaded) |
| **Priority** | **HIGH** |

---

### TC008: Session Established with RBAC Role
| TID | TC008 |
|-----|-------|
| **Category** | Functional - Authorization |
| **Description** | Verify user session created with correct RBAC role after authentication |
| **Trace to PRD** | Section "Authorization" - Role-based access control (RBAC) |
| **Pre-conditions** | 1. User account with specific RBAC role (QA/PM/Admin [ASSUMED])<br>2. Valid credentials<br>3. Browser dev tools available |
| **Steps** | 1. Login with role-specific user credentials<br>2. Check browser storage (localStorage/sessionStorage) for role [ASSUMED]<br>3. Or inspect network request to Dashboard<br>4. Verify role matches user's assigned role<br>5. Check accessible features match role permissions |
| **Expected Result** | ✓ Session token created [ASSUMED structure not specified]<br>✓ User role stored in session/cookie [ASSUMED]<br>✓ Role matches user's assigned permission level<br>✓ Feature access controlled per RBAC configuration<br>✓ Unauthorized features hidden/disabled |
| **Priority** | **HIGH** |
| **Note** | [ASSUMED] RBAC details - specific roles and permissions not documented |

---

## NEGATIVE TEST CASES

### TC009: Invalid Email - Non-existent Account
| TID | TC009 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify login fails with non-existent email address in correct format |
| **Trace to PRD** | Section "Authentication" - email validation required |
| **Pre-conditions** | 1. Login page loaded<br>2. Email format valid but account doesn't exist<br>3. Test email: nonexistent999@example.com |
| **Steps** | 1. Enter email: nonexistent999@example.com<br>2. Enter password: SomePassword123<br>3. Click reCAPTCHA if required<br>4. Click "Sign in" button<br>5. Wait for response |
| **Expected Result** | ✗ Authentication fails<br>✓ Error message displayed: "Your email, password, IP address or location did not match"<br>✓ User remains on login page<br>✓ Form NOT cleared [ASSUMED - UX not specified]<br>✓ Failed attempt logged (activity logging per PRD)<br>✓ reCAPTCHA counter incremented [ASSUMED] |
| **Priority** | **HIGH** |
| **Source** | login_error.jpg shows exact error message |

---

### TC010: Invalid Password - Correct Email, Wrong Password
| TID | TC010 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify login fails when correct email provided but wrong password |
| **Trace to PRD** | Section "Authentication" - password validation |
| **Pre-conditions** | 1. Valid user account: testuser@vwo.com<br>2. Correct password: Test@123Secure<br>3. Wrong password: InvalidPass123 (test data)<br>4. Login page loaded |
| **Steps** | 1. Enter email: testuser@vwo.com<br>2. Enter password: InvalidPass123<br>3. Click reCAPTCHA if required<br>4. Click "Sign in" button |
| **Expected Result** | ✗ Authentication fails<br>✓ Error message: "Your email, password, IP address or location did not match"<br>✓ User remains on login page (not redirected)<br>✓ Incorrect password not revealed in error<br>✓ Failed attempt logged (activity logging per PRD)<br>✓ [ASSUMED] Attempt counter incremented for rate limiting |
| **Priority** | **HIGH** |
| **Source** | login_error.jpg |

---

### TC011: Empty Email Field
| TID | TC011 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify form validation fails when email field is empty |
| **Trace to PRD** | [NOT SPECIFIED - assumed required field] |
| **Pre-conditions** | 1. Login page loaded<br>2. Email field empty<br>3. Password field filled (e.g., "password123") |
| **Steps** | 1. Leave email field EMPTY<br>2. Enter password: password123<br>3. Click "Sign in" button |
| **Expected Result** | ✓ Form validation triggered [ASSUMED]<br>✓ Error message displayed [TYPE NOT SPECIFIED]<br>✓ Likely message: "Email is required" [ASSUMED]<br>✓ Form NOT submitted to backend<br>✓ User remains on login page |
| **Priority** | **MEDIUM** |
| **Note** | [ASSUMED] HTML5 required field validation - implementation not specified |

---

### TC012: Empty Password Field
| TID | TC012 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify form validation fails when password field is empty |
| **Trace to PRD** | [NOT SPECIFIED] |
| **Pre-conditions** | 1. Login page loaded<br>2. Email field filled: testuser@vwo.com<br>3. Password field empty |
| **Steps** | 1. Enter email: testuser@vwo.com<br>2. Leave password field EMPTY<br>3. Click "Sign in" button |
| **Expected Result** | ✓ Form validation fails [ASSUMED]<br>✓ Error message displayed [TYPE NOT SPECIFIED]<br>✓ Likely: "Password is required" [ASSUMED]<br>✓ Form NOT submitted<br>✓ User remains on login page |
| **Priority** | **MEDIUM** |

---

### TC013: Both Email and Password Empty
| TID | TC013 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify form validation requires both email and password |
| **Trace to PRD** | [NOT SPECIFIED] |
| **Pre-conditions** | 1. Login page loaded and ready<br>2. Both fields empty (default state) |
| **Steps** | 1. Do NOT enter any text in email field<br>2. Do NOT enter any text in password field<br>3. Click "Sign in" button directly |
| **Expected Result** | ✓ Form validation triggered on both fields [ASSUMED]<br>✓ Multiple error messages displayed [ASSUMED]<br>✓ Form NOT submitted<br>✓ User remains on login page |
| **Priority** | **MEDIUM** |

---

### TC014: Invalid Email Format (Missing @)
| TID | TC014 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify email format validation rejects malformed email |
| **Trace to PRD** | [NOT SPECIFIED - assumed standard email validation] |
| **Pre-conditions** | 1. Login page loaded<br>2. Invalid email format: "notanemail.com" (missing @)<br>3. Password field filled |
| **Steps** | 1. Enter invalid email: notanemail.com<br>2. Enter password: SomePassword123<br>3. Click "Sign in" button |
| **Expected Result** | ✓ Email format validation fails [ASSUMED]<br>✓ Error message: "Invalid email format" [ASSUMED]<br>✓ Form NOT submitted OR backend rejects as invalid<br>✓ User remains on login page |
| **Priority** | **MEDIUM** |
| **Note** | [ASSUMED] Email regex validation per RFC 5322 |

---

### TC015: Special Characters in Email
| TID | TC015 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify email field handles special characters safely |
| **Trace to PRD** | [NOT SPECIFIED] |
| **Pre-conditions** | 1. Login page loaded<br>2. Email with special chars: test!@#$@vwo.com<br>3. Valid password |
| **Steps** | 1. Enter email: test!@#$@vwo.com<br>2. Enter password: ValidPass123<br>3. Click "Sign in" button |
| **Expected Result** | ✓ Input accepted or validation error (depends on email rules)<br>✓ Form properly escapes input [NOT SPECIFIED]<br>✓ No injection vulnerability<br>✓ Appropriate error or rejection |
| **Priority** | **LOW** |
| **Note** | [ASSUMED] Behavior depending on email validation rules |

---

### TC016: Account Suspended or Inactive
| TID | TC016 |
|-----|-------|
| **Category** | Functional - Negative |
| **Description** | Verify suspended/inactive account cannot login |
| **Trace to PRD** | Section "Authorization" - access control with account status |
| **Pre-conditions** | 1. User account exists but is suspended/inactive<br>2. Valid credentials for this account<br>3. Test account: suspended@vwo.com (test data) |
| **Steps** | 1. Enter email: suspended@vwo.com<br>2. Enter valid password for this account<br>3. Click "Sign in" button |
| **Expected Result** | ✗ Authentication fails<br>✓ Error message displayed [TYPE NOT SPECIFIED]<br>✓ Likely: "Account suspended" or similar [ASSUMED]<br>✓ User NOT redirected<br>✓ User remains on login page<br>✓ Activity logged |
| **Priority** | **MEDIUM** |
| **Note** | [ASSUMED] Account status checking - implementation not specified |

---

## SECURITY TEST CASES

### TC017: SQL Injection on Email Field
| TID | TC017 |
|-----|-------|
| **Category** | Security - Input Validation |
| **Description** | Verify SQL injection attempt on email field is prevented |
| **Trace to PRD** | Section "Data Protection" - security requirement |
| **Pre-conditions** | 1. Login page loaded<br>2. SQL injection payload: admin' OR '1'='1<br>3. Valid password: SomePassword123 |
| **Steps** | 1. Enter email field: admin' OR '1'='1<br>2. Enter password: SomePassword123<br>3. Click "Sign in" button<br>4. Monitor for unusual behavior |
| **Expected Result** | ✓ Injection attack prevented [ASSUMED parameterized queries]<br>✓ Input treated as literal string<br>✓ Authentication fails with normal error<br>✓ No database error exposed to user<br>✓ Attack logged and monitored [ASSUMED]<br>✓ No unauthorized access granted |
| **Priority** | **CRITICAL** |
| **Compliance** | OWASP Top 10 - A03:2021 Injection |

---

### TC018: XSS Injection on Email Field
| TID | TC018 |
|-----|-------|
| **Category** | Security - XSS Prevention |
| **Description** | Verify XSS payload on email field is escaped and not executed |
| **Trace to PRD** | Section "Data Protection" - security |
| **Pre-conditions** | 1. Login page loaded<br>2. XSS payload: <script>alert('XSS')</script><br>3. Valid password |
| **Steps** | 1. Enter email: <script>alert('XSS')</script><br>2. Enter password: password123<br>3. Click "Sign in" button<br>4. Monitor for JavaScript execution<br>5. Check browser console for errors |
| **Expected Result** | ✓ Script NOT executed<br>✓ No alert popup appears<br>✓ Input escaped in form data [ASSUMED]<br>✓ Input transmitted safely to server [ASSUMED]<br>✓ Normal authentication flow continues or fails with error<br>✓ Page remains safe (no defacement) |
| **Priority** | **CRITICAL** |
| **Compliance** | OWASP Top 10 - A03:2021 Injection / A07:2021 Cross-Site Scripting |

---

### TC019: TLS/SSL Encryption - Certificate Validation
| TID | TC019 |
|-----|-------|
| **Category** | Security - Transport Security |
| **Description** | Verify HTTPS connection uses valid TLS/SSL certificate |
| **Trace to PRD** | Section "Data Protection" - "Encryption in transit (TLS)" |
| **Pre-conditions** | 1. Browser with developer tools<br>2. Network tab and Security tab accessible<br>3. Navigating to https://app.vwo.com/ |
| **Steps** | 1. Open Chrome DevTools (F12)<br>2. Go to Network tab<br>3. Go to Security tab<br>4. Navigate to https://app.vwo.com/<br>5. Inspect protocol and certificate |
| **Expected Result** | ✓ Page accessible via HTTPS (not HTTP)<br>✓ Green padlock visible in URL bar<br>✓ Security tab shows: "Connection is secure"<br>✓ TLS version: 1.2 or higher [Per PRD: "TLS"]<br>✓ Certificate valid and not expired<br>✓ Certificate issued by trusted CA<br>✓ No mixed HTTP/HTTPS content [ASSUMED]<br>✓ HSTS header present [ASSUMED] |
| **Priority** | **CRITICAL** |

---

### TC020: Password Transmitted Encrypted
| TID | TC020 |
|-----|-------|
| **Category** | Security - Data Protection |
| **Description** | Verify password is encrypted during transmission (not plain text) |
| **Trace to PRD** | Section "Data Protection" - "Encryption in transit (TLS)" |
| **Pre-conditions** | 1. Browser with Network tab (HTTPS traffic interception capable)<br>2. Valid credentials ready<br>3. HTTPS proxy/Burp Suite [ASSUMED - optional for interception] |
| **Steps** | 1. Open Network tab (DevTools or Proxy)<br>2. Enter valid email: testuser@vwo.com<br>3. Enter valid password: Test@123Secure<br>4. Click "Sign in"<br>5. Inspect request body in Network tab<br>6. Verify password is NOT visible in plain text |
| **Expected Result** | ✓ Request sent via HTTPS (not HTTP)<br>✓ Request body encrypted (cannot read raw request in Network tab)<br>✓ Password NOT visible as plain text in request<br>✓ If form submission visible, password field shows masked (•••) |
| **Priority** | **CRITICAL** |

---

### TC021: RBAC - Unauthorized Feature Access Blocked
| TID | TC021 |
|-----|-------|
| **Category** | Security - Authorization |
| **Description** | Verify user cannot access features for which they lack RBAC permissions |
| **Trace to PRD** | Section "Authorization" - "Role-based access control (RBAC)" |
| **Pre-conditions** | 1. User with limited role (e.g., Viewer, Tester)<br>2. Feature requires higher role (e.g., Admin)<br>3. Valid credentials for limited-role user |
| **Steps** | 1. Login with limited-role user<br>2. Attempt to access admin-only feature (URL manipulation [ASSUMED] or navigation)<br>3. Monitor access control |
| **Expected Result** | ✓ Feature access blocked<br>✓ Error message or redirect to permitted page<br>✓ Attempt logged (activity logging per PRD)<br>✓ No sensitive data exposed<br>✓ User remains on allowed page/dashboard |
| **Priority** | **HIGH** |
| **Note** | [ASSUMED] RBAC implementation - specific roles not documented |

---

### TC022: Activity Logging - Failed Login Attempt Recorded
| TID | TC022 |
|-----|-------|
| **Category** | Security - Audit Logging |
| **Description** | Verify failed login attempts are recorded in activity logs |
| **Trace to PRD** | Section "Data Protection" - "Activity logging" required |
| **Pre-conditions** | 1. Admin access to activity logs [ASSUMED]<br>2. User account: testuser@vwo.com<br>3. Wrong password: WrongPassword123<br>4. System timestamp synchronized |
| **Steps** | 1. Attempt login with wrong password<br>2. Observe login failure<br>3. Access activity logs as admin [ASSUMED method]<br>4. Search for failed login event<br>5. Verify log contains: timestamp, user email, IP, failure reason |
| **Expected Result** | ✓ Failed login event recorded in logs<br>✓ Log contains: timestamp, email, IP address<br>✓ Failure reason: "Invalid credentials" or similar<br>✓ Log entry retrievable and traceable<br>✓ Multiple failed attempts visible in log sequence |
| **Priority** | **HIGH** |

---

## CROSS-BROWSER TEST CASES

### TC023: Chrome Browser - Login Functionality
| TID | TC023 |
|-----|-------|
| **Category** | Cross-browser |
| **Description** | Verify login functions correctly on Chrome latest stable |
| **Trace to PRD** | Frontend tech stack: React (compatible with Chrome) |
| **Pre-conditions** | 1. Chrome browser (latest stable - v125+)<br>2. Windows 10/11, macOS, or Linux OS<br>3. Valid credentials |
| **Steps** | 1. Open Chrome<br>2. Navigate to https://app.vwo.com/<br>3. Enter valid email and password<br>4. Click "Sign in"<br>5. Verify no console errors (F12) |
| **Expected Result** | ✓ Page renders without glitches<br>✓ Form inputs work smoothly<br>✓ Buttons clickable and responsive<br>✓ reCAPTCHA functions<br>✓ Error messages display correctly<br>✓ No JavaScript errors in console<br>✓ Login succeeds or fails with expected result<br>✓ Dashboard loads properly after login |
| **Priority** | **HIGH** |

---

### TC024: Firefox Browser - Login Functionality
| TID | TC024 |
|-----|-------|
| **Category** | Cross-browser |
| **Description** | Verify login functions correctly on Firefox latest stable |
| **Trace to PRD** | Frontend tech stack: React (compatible with Firefox) |
| **Pre-conditions** | 1. Firefox browser (latest stable - v126+)<br>2. Valid credentials ready |
| **Steps** | 1. Open Firefox<br>2. Navigate to https://app.vwo.com/<br>3. Enter valid email and password<br>4. Click "Sign in"<br>5. Open Developer Tools (F12) and check Console |
| **Expected Result** | ✓ Page renders without issues<br>✓ All form elements functional<br>✓ Login successful or error as expected<br>✓ No browser-specific glitches<br>✓ Dashboard accessible after successful login |
| **Priority** | **HIGH** |

---

### TC025: Edge Browser - Login Functionality
| TID | TC025 |
|-----|-------|
| **Category** | Cross-browser |
| **Description** | Verify login works on Microsoft Edge latest |
| **Trace to PRD** | React/TypeScript frontend compatible with Edge |
| **Pre-conditions** | 1. Edge browser (latest - v125+)<br>2. Windows 10/11<br>3. Valid credentials |
| **Steps** | 1. Open Microsoft Edge<br>2. Go to https://app.vwo.com/<br>3. Enter email and password<br>4. Click reCAPTCHA if required<br>5. Click "Sign in" |
| **Expected Result** | ✓ Page renders correctly<br>✓ Form responsive and interactive<br>✓ Login flow works as expected<br>✓ Dashboard loads within SLA<br>✓ No Edge-specific errors |
| **Priority** | **HIGH** |

---

### TC026: Safari Browser - Login Functionality
| TID | TC026 |
|-----|-------|
| **Category** | Cross-browser |
| **Description** | Verify login functions on Safari (macOS) |
| **Trace to PRD** | React frontend compatible with Safari |
| **Pre-conditions** | 1. Safari browser (latest on macOS)<br>2. macOS Monterey or newer<br>3. Valid credentials |
| **Steps** | 1. Open Safari<br>2. Navigate to https://app.vwo.com/<br>3. Enter credentials<br>4. Complete login flow |
| **Expected Result** | ✓ Page loads and renders correctly<br>✓ Forms function without issues<br>✓ No Safari-specific layout problems<br>✓ Login successful with expected behavior |
| **Priority** | **MEDIUM** |

---

## RESPONSIVE DESIGN TEST CASES

### TC027: Mobile View - Login Page Responsive
| TID | TC027 |
|-----|-------|
| **Category** | Responsive Design |
| **Description** | Verify login page adapts to mobile screen (375x667px) |
| **Trace to PRD** | [ASSUMED] Modern responsive design |
| **Pre-conditions** | 1. Chrome DevTools open<br>2. Device emulation: iPhone 12 (375x667)<br>3. Login page loaded |
| **Steps** | 1. Open Chrome DevTools<br>2. Toggle Device Toolbar (Ctrl+Shift+M)<br>3. Select iPhone 12 profile<br>4. Refresh page<br>5. Verify layout at mobile size<br>6. Scroll and interact with all elements |
| **Expected Result** | ✓ No horizontal scroll needed<br>✓ VWO logo visible<br>✓ Email field full width and readable<br>✓ Password field full width and functional<br>✓ All buttons have minimum 48x48px touch targets [ASSUMED]<br>✓ reCAPTCHA accessible<br>✓ Sign-in options visible or in dropdown<br>✓ "Forgot Password?" and "Free Trial" links accessible<br>✓ Text readable without pinch-zoom |
| **Priority** | **MEDIUM** |

---

### TC028: Tablet View - Login Page Responsive
| TID | TC028 |
|-----|-------|
| **Category** | Responsive Design |
| **Description** | Verify login page adapts to tablet screen (768x1024px) |
| **Trace to PRD** | [ASSUMED] Responsive design |
| **Pre-conditions** | 1. Chrome DevTools<br>2. Device emulation: iPad (768x1024)<br>3. Login page loaded |
| **Steps** | 1. Open DevTools<br>2. Toggle Device Toolbar<br>3. Select iPad profile<br>4. Refresh page<br>5. Verify layout optimization |
| **Expected Result** | ✓ Layout optimized for tablet size<br>✓ All form elements properly spaced<br>✓ Buttons appropriately sized and tappable<br>✓ No excessive gaps or compression<br>✓ Content centered or properly aligned [ASSUMED]<br>✓ All functionality accessible without horizontal scroll |
| **Priority** | **MEDIUM** |

---

### TC029: Password Field Visibility Toggle
| TID | TC029 |
|-----|-------|
| **Category** | UI/UX - Usability |
| **Description** | Verify password visibility toggle (eye icon) works correctly |
| **Trace to PRD** | UI element visible on login_error.jpg |
| **Pre-conditions** | 1. Login page loaded<br>2. Password entered: Test@123Secure<br>3. Eye icon visible next to password field |
| **Steps** | 1. Enter password: Test@123Secure<br>2. Verify password initially shows as dots (•••)<br>3. Click eye icon to show password<br>4. Verify text now shows as plain text<br>5. Click eye icon again to hide password |
| **Expected Result** | ✓ Password field shows masked text by default (•••)<br>✓ Clicking eye icon reveals plain text<br>✓ Clicking again hides text back to masked<br>✓ Icons clearly indicate state (open/closed eye)<br>✓ Toggle has accessible label [ASSUMED] |
| **Priority** | **LOW** |

---

## TEST CASE SUMMARY TABLE

| Test ID | Category | Description | Priority | Status |
|---------|----------|-------------|----------|--------|
| TC001-TC008 | Positive | Happy path, SSO, 2FA, Performance, RBAC | CRITICAL/HIGH | Ready |
| TC009-TC016 | Negative | Invalid creds, empty fields, suspended account | HIGH/MEDIUM | Ready |
| TC017-TC022 | Security | SQL/XSS injection, TLS, RBAC, logging | CRITICAL/HIGH | Ready |
| TC023-TC026 | Cross-browser | Chrome, Firefox, Edge, Safari | HIGH/MEDIUM | Ready |
| TC027-TC029 | Responsive/UX | Mobile/tablet/toggle | MEDIUM/LOW | Ready |
| **TOTAL** | **Mixed** | **29 test cases** | **Mixed** | **READY** |

---

## Traceability to VWO PRD

| PRD Section | Coverage | Test Cases |
|-------------|----------|-----------|
| Authentication | Email/Password, SSO, 2FA | TC001-TC006, TC009-TC010 |
| Authorization | RBAC | TC008, TC021 |
| Data Protection | TLS, encryption, logging | TC017-TC022 |
| Performance | 2-second SLA | TC007 |
| Security | Input validation | TC009-TC022 |

---

**All test cases follow anti-hallucination rules. Items marked [ASSUMED] represent inferences not explicitly documented in PRD or login_error.jpg.**

