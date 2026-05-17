# VWO Login Page - Test Scenarios

**Feature:** Login Page  
**URL:** https://app.vwo.com/  
**Status:** Ready for Test Case Generation  
**Date:** May 17, 2026  

---

## Test Scenario Mapping

### Category: HAPPY PATH / POSITIVE SCENARIOS

#### S1: Successful Login with Valid Email and Password
**Pre-requisite:** User account exists with active status  
**Trigger:** User enters valid email and correct password, clicks Sign In  
**Expected Outcome:** 
- Form validation passes
- Authentication successful
- User redirected to VWO Dashboard
- Dashboard loads within 2 seconds (per PRD SLA)
- Activity log entry created (per PRD security requirement)
**Priority:** CRITICAL  
**Trace to PRD:** Section "Authentication" - Email + password support  

---

#### S2: Successful Login via SSO (Single Sign-On)
**Pre-requisite:** User has SSO account linked  
**Trigger:** User clicks "Sign in using SSO" button  
**Expected Outcome:**
- Redirected to SSO provider login
- After SSO authentication succeeds, returned to VWO Dashboard
- User session established per RBAC permissions
**Priority:** HIGH  
**Trace to PRD:** Section "Authentication" - SSO support  
**[ASSUMED]** SSO provider configuration details not specified

---

#### S3: Successful Login via Google Authentication
**Pre-requisite:** User has Google account linked to VWO  
**Trigger:** User clicks "Sign in with Google" button  
**Expected Outcome:**
- Popup/redirect to Google login
- After Google authentication, returned to VWO Dashboard
- User session created with appropriate RBAC role
**Priority:** HIGH  
**Trace to PRD:** Section "Integrations" - No explicit mention but visible on UI  
**[ASSUMED]** Google OAuth 2.0 implementation

---

#### S4: Successful Login via Passkey
**Pre-requisite:** User has registered a passkey/passwordless method  
**Trigger:** User clicks "Sign in with Passkey" button  
**Expected Outcome:**
- Passkey authentication initiated
- After successful authentication, redirected to Dashboard
- Session established with user's RBAC permissions
**Priority:** MEDIUM  
**Trace to PRD:** Visible on UI (login_error.jpg) but not mentioned in PRD text  
**[ASSUMED]** WebAuthn/FIDO2 passkey implementation

---

#### S5: Two-Factor Authentication (2FA) - SMS/Email
**Pre-requisite:** 2FA enabled in user account settings  
**Trigger:** User enters valid credentials, 2FA verification code required  
**Expected Outcome:**
- After valid email/password, OTP/code prompt appears
- User enters received OTP
- After OTP validation, redirected to Dashboard
- Full authentication logged per activity logging requirement
**Priority:** HIGH  
**Trace to PRD:** Section "Authentication" - Two-factor authentication (2FA) support  

---

#### S6: Remember Me Functionality - Session Persistence
**Pre-requisite:** User logs in with "Remember me" checkbox checked  
**Trigger:** User closes browser and returns to site  
**Expected Outcome:**
- [ASSUMED] User remains logged in or can skip re-login
- Session cookie/token still valid
- No re-authentication required (up to session timeout)
**Priority:** MEDIUM  
**[ASSUMED]** "Remember me" extends session duration - NOT SPECIFIED in PRD

---

### Category: NEGATIVE SCENARIOS

#### S7: Invalid Email - Non-existent Account
**Pre-requisite:** Email exists in email format but no VWO account  
**Trigger:** User enters valid-format email that doesn't exist, correct password, clicks Sign In  
**Expected Outcome:**
- Error message displayed: "Your email, password, IP address or location did not match"
- User remains on login page
- Form clears or retains email (depends on UX design [NOT SPECIFIED])
**Priority:** HIGH  
**Trace to PRD:** Section "Authentication" - Email + password validation  
**Source:** login_error.jpg shows exact error message

---

#### S8: Invalid Password - Correct Email, Wrong Password
**Pre-requisite:** Valid VWO account exists  
**Trigger:** User enters correct email but wrong password, clicks Sign In  
**Expected Outcome:**
- Error message displayed: "Your email, password, IP address or location did not match"
- User NOT authenticated
- User remains on login page
- Failed attempt logged per activity logging (PRD requirement)
- [ASSUMED] Counter incremented for rate limiting
**Priority:** HIGH  
**Trace to PRD:** Section "Authentication" - password validation required  
**Source:** login_error.jpg

---

#### S9: Empty Email Field
**Pre-requisite:** Login page loaded  
**Trigger:** User leaves email field empty and clicks Sign In  
**Expected Outcome:**
- Client-side validation triggered [ASSUMED - NOT SPECIFIED]
- Error message displayed (type [NOT SPECIFIED])
- Form NOT submitted to backend
- User remains on login page
**Priority:** MEDIUM  
**[ASSUMED]** HTML5 required field validation or custom error message

---

#### S10: Empty Password Field
**Pre-requisite:** Login page loaded, valid email entered  
**Trigger:** User leaves password field empty and clicks Sign In  
**Expected Outcome:**
- Form validation fails [ASSUMED]
- Error message shown (content [NOT SPECIFIED])
- Form NOT submitted
- User remains on login page
**Priority:** MEDIUM  
**[ASSUMED]** Required field validation on password

---

#### S11: Both Email and Password Empty
**Pre-requisite:** Login page loaded  
**Trigger:** User clicks Sign In without entering any credentials  
**Expected Outcome:**
- Validation fails on both fields [ASSUMED]
- Error messages displayed
- User remains on login page
**Priority:** MEDIUM  

---

#### S12: Incorrect Email Format
**Pre-requisite:** Login page loaded  
**Trigger:** User enters malformed email (e.g., "notanemail") and clicks Sign In  
**Expected Outcome:**
- Email format validation fails [ASSUMED]
- Error message: "Invalid email format" [ASSUMED - NOT SPECIFIED]
- Form NOT submitted or submitted with error response
**Priority:** MEDIUM  
**[ASSUMED]** Email regex validation

---

#### S13: Multiple Failed Login Attempts
**Pre-requisite:** Valid account exists  
**Trigger:** User enters wrong password 5 times (example [ASSUMED]) and clicks Sign In  
**Expected Outcome:**
- After N failed attempts: [NOT SPECIFIED]
  - [POSSIBLE] Account temporarily locked
  - [POSSIBLE] Rate limiting applied (IP-based)
  - [POSSIBLE] Error message: "Too many failed attempts"
  - [POSSIBLE] CAPTCHA challenges appear
- User cannot login
**Priority:** HIGH  
**[ASSUMED]** Account lockout or rate limiting - NOT SPECIFIED in requirements

---

#### S14: Suspended or Inactive Account
**Pre-requisite:** Account exists but is suspended/inactive  
**Trigger:** User enters valid credentials for inactive account, clicks Sign In  
**Expected Outcome:**
- Authentication fails
- Error message displayed [TYPE NOT SPECIFIED]
- User remains on login page
- Activity logged (failed authentication attempt)
**Priority:** HIGH  
**[ASSUMED]** Account status validation during authentication

---

### Category: SECURITY SCENARIOS

#### S15: SQL Injection Attempt on Email Field
**Pre-requisite:** Login page loaded  
**Trigger:** User enters SQL injection payload: `admin' OR '1'='1` in email field  
**Expected Outcome:**
- Input sanitized/parameterized [ASSUMED]
- Injection attack prevented
- Error message displayed [TYPE NOT SPECIFIED]
- Attack attempt logged per activity logging
- No data leaked
**Priority:** CRITICAL  
**Trace to PRD:** Section "Data Protection" - encryption & logging required  
**Mitigation:** Per anti-hallucination rules, actual payload testing should follow OWASP guidelines

---

#### S16: XSS Injection Attempt on Email Field
**Pre-requisite:** Login page loaded  
**Trigger:** User enters XSS payload: `<script>alert('XSS')</script>` in email field  
**Expected Outcome:**
- Script NOT executed
- Input escaped/sanitized [ASSUMED]
- Error message or validation failure
- No page defacement
**Priority:** CRITICAL  
**Trace to PRD:** Section "Data Protection" - security requirement  

---

#### S17: TLS/SSL Certificate Validation
**Pre-requisite:** Connection to https://app.vwo.com/  
**Trigger:** Inspect network traffic during login  
**Expected Outcome:**
- TLS 1.2 or higher used (per PRD requirement)
- Valid SSL certificate presented
- Certificate chain verified
- No mixed HTTP/HTTPS content [ASSUMED]
- Password transmission encrypted
**Priority:** CRITICAL  
**Trace to PRD:** Section "Data Protection" - "Encryption in transit (TLS)"

---

#### S18: Session Hijacking Prevention
**Pre-requisite:** User logged in, session established  
**Trigger:** Attempt to use captured session token from different IP/browser  
**Expected Outcome:**
- Session rejected [ASSUMED - not specified]
- User re-authentication required
- Suspicious activity logged
- [ASSUMED] Activity logging per PRD
**Priority:** HIGH  
**[ASSUMED]** Session validation against IP/user-agent not specified

---

### Category: UI/UX SCENARIOS

#### S19: Forgot Password Link Functionality
**Pre-requisite:** Login page loaded  
**Trigger:** User clicks "Forgot Password?" link  
**Expected Outcome:**
- Page navigates to password reset form or modal appears
- Email field pre-populated [ASSUMED - NOT SPECIFIED]
- User can initiate password recovery
**Priority:** MEDIUM  
**[ASSUMED]** Password reset flow exists - NOT DETAILED in PRD

---

#### S20: Free Trial Sign-Up Link
**Pre-requisite:** Login page loaded  
**Trigger:** User clicks "Start a FREE TRIAL" button  
**Expected Outcome:**
- Navigates to signup/trial registration page [ASSUMED - NOT SPECIFIED]
- User can create new account
**Priority:** LOW  
**[ASSUMED]** Trial signup flow implementation

---

#### S21: reCAPTCHA Interaction - Human Verification
**Pre-requisite:** After certain failed attempts or on first attempt  
**Trigger:** User interacts with "I'm not a robot" reCAPTCHA checkbox  
**Expected Outcome:**
- reCAPTCHA validation completed
- User verified as human
- Can proceed with login
- [ASSUMED] Rate limiting reset or removed
**Priority:** MEDIUM  
**[ASSUMED]** Google reCAPTCHA v2/v3 implementation - implementation details NOT SPECIFIED

---

#### S22: Password Visibility Toggle
**Pre-requisite:** Login page loaded, password entered  
**Trigger:** User clicks eye icon next to password field  
**Expected Outcome:**
- Password text becomes visible (toggles between • and plain text)
- [ASSUMED] User can see password entered for verification
- User experience enhanced
**Priority:** LOW  
**Visible on:** login_error.jpg shows eye icon

---

#### S23: Responsive Design - Mobile View
**Pre-requisite:** Login page on mobile device  
**Trigger:** Resize browser to mobile dimensions (375×667)  
**Expected Outcome:**
- All elements visible without horizontal scroll
- Buttons readable and tappable (48×48 minimum [ASSUMED])
- Form fields properly sized
- Error messages visible
- Page loads and functions normally
**Priority:** MEDIUM  
**[ASSUMED]** Mobile responsive design per modern UX standards

---

#### S24: Responsive Design - Tablet View
**Pre-requisite:** Login page on tablet device  
**Trigger:** Resize browser to tablet dimensions (768×1024)  
**Expected Outcome:**
- Layout optimized for tablet
- All form elements usable
- No content overflow
- Page responsive and functions correctly
**Priority:** MEDIUM  

---

#### S25: Page Load Performance
**Pre-requisite:** User navigates to https://app.vwo.com/  
**Trigger:** Page starts loading  
**Expected Outcome:**
- Initial page load: ≤ 1.5 seconds [ASSUMED - PRD states Dashboard 2 sec SLA]
- All assets loaded (CSS, JS, images)
- Page interactive/forms usable
- No visual glitches
**Priority:** HIGH  
**Trace to PRD:** "Dashboard and editing workflows respond within 2 seconds"

---

### Category: CROSS-BROWSER SCENARIOS

#### S26-S29: Cross-Browser Compatibility (Chrome/Firefox/Edge/Safari)
**Test Cases Generated:** 4 separate scenarios  
Each browser tests:
- Page renders correctly
- Forms submit properly
- Error messages display
- Password toggle works
- reCAPTCHA functions
- All sign-in options accessible

**Priority:** HIGH for each  
**Browsers (per PRD best practices):**
- Chrome (latest stable)
- Firefox (latest stable)
- Edge (latest stable)
- Safari (latest on macOS)

---

## Scenario Summary Statistics

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| Happy Path | 6 | CRITICAL/HIGH | Ready |
| Negative | 8 | HIGH/MEDIUM | Ready |
| Security | 4 | CRITICAL/HIGH | Ready |
| UI/UX | 7 | MEDIUM/LOW | Ready |
| Cross-browser | 4 | HIGH | Ready |
| **TOTAL** | **29** | Mixed | **Ready** |

---

## Traceability Matrix

| Scenario | PRD Section | Image Reference | Assumption Count |
|----------|------------|-----------------|------------------|
| S1-S4: Auth Methods | "Authentication" | login_error.jpg | 2 |
| S5: 2FA | "Authentication" | N/A | 1 |
| S6: Remember Me | UI element | login_error.jpg | 3 |
| S7-S8: Invalid Creds | "Authentication" | login_error.jpg | 0 |
| S9-S10: Empty Fields | N/A | N/A | 2 |
| S15-S18: Security | "Data Protection" | N/A | 4 |
| S22-S24: UX | UI elements | login_error.jpg | 5 |
| S26-S29: Cross-browser | General | N/A | 2 |

---

## [ASSUMED] vs [NOT SPECIFIED] Summary

**Items marked [ASSUMED]:**
- Account lockout after N failed attempts
- Session timeout duration
- Password strength requirements
- 2FA methods (SMS vs TOTP vs email)
- Staging/Development URLs
- Specific API error codes
- Input validation error messages
- Mobile responsive breakpoints
- Remember me session duration

**Items marked [NOT SPECIFIED]:**
- Email verification requirements
- Account recovery workflow details
- Password policies
- Rate limiting thresholds
- CAPTCHA challenge types

---

**Per Anti-Hallucination Rules:** Each scenario is traceable to either VWO PRD, login_error.jpg, or explicitly marked [ASSUMED] for inference.

