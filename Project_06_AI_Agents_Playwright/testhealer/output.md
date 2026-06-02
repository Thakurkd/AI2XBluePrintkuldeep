# Test Healer Report — VWO TC-02

**Date:** 2026-06-02
**Test File:** src/tests/vwo-wrong-password.spec.ts
**Status:** HEALED ✅

---

## Bugs Found

### BUG-1: Wrong CSS Selector in VWOLoginPage.ts
- **File:** src/pages/VWOLoginPage.ts
- **Line:** 19
- **Broken:** `page.locator('#notification-box-msg')`
- **Fixed:** `page.locator('#js-notification-box-msg')`
- **Root Cause:** Missing `js-` prefix in the element ID

### BUG-2: Wrong Selector in Spec + Wrong Expected Text
- **File:** src/tests/vwo-wrong-password.spec.ts
- **Line:** 27 (selector), 36 (text)
- **Broken selector:** `page.locator('#notification-box-msg')`
- **Fixed selector:** `page.locator('#js-notification-box-msg')`
- **Broken text:** `'Your credentials did not match'`
- **Fixed text:** `'Your email, password, IP address or location did not match'`
- **Root Cause:** Assertion text did not match the actual VWO server response message

### BUG-3: SPA Redirect Race Condition in VWOLoginPage.ts open()
- **File:** src/pages/VWOLoginPage.ts
- **Line:** 22–24 (`open()` method)
- **Broken:** `open()` only waited for `domcontentloaded`, which resolved before the Angular SPA finished its redirect from `https://app.vwo.com/` back to `#/login`, causing `loginAs()` to fill a form that was then wiped by the navigation
- **Fixed:** Added `await this.el.waitForVisible(this.loginButton)` after `goto()` so the page object waits for the login form to be stable before returning control to the test
- **Root Cause:** VWO's Angular SPA performs a redirect on initial load; `domcontentloaded` fires too early for the form to be interactable

---

## Healing Steps Taken
1. Read both broken files (`VWOLoginPage.ts` and `vwo-wrong-password.spec.ts`) to understand the existing structure and locate the bug markers in comments.
2. Applied BUG-1 fix in `VWOLoginPage.ts`: changed `page.locator('#notification-box-msg')` to `page.locator('#js-notification-box-msg')` on line 17.
3. Applied BUG-2 selector fix in `vwo-wrong-password.spec.ts`: changed `page.locator('#notification-box-msg')` to `page.locator('#js-notification-box-msg')` on line 27.
4. Applied BUG-2 text fix in `vwo-wrong-password.spec.ts`: changed `'Your credentials did not match'` to `'Your email, password, IP address or location did not match'` on line 34.
5. Ran the test — it failed with `Received: hidden`. The element `#js-notification-box-msg` was found in the DOM but hidden, indicating the login form was never submitted (screenshot confirmed empty email/password fields).
6. Diagnosed BUG-3: VWO SPA redirects to `https://app.vwo.com/` then back to `#/login` after `goto()`. The `waitForLoadState('domcontentloaded')` resolved before this redirect cycle completed, so `loginAs()` filled a form that was subsequently wiped.
7. Applied BUG-3 fix in `VWOLoginPage.ts` `open()` method: added `await this.el.waitForVisible(this.loginButton)` to wait for the login button to be present and stable before handing control back to the test.
8. Re-ran the test — it passed in 8.5 seconds with the actual error text confirmed as `"Your email, password, IP address or location did not match"`.

---

## Before vs After

| | Before (Broken) | After (Healed) |
|---|---|---|
| Selector (page object) | `#notification-box-msg` | `#js-notification-box-msg` |
| Selector (spec) | `#notification-box-msg` | `#js-notification-box-msg` |
| Expected text | `Your credentials did not match` | `Your email, password, IP address or location did not match` |
| `open()` readiness | `waitForLoadState('domcontentloaded')` only | + `waitForVisible(loginButton)` to survive SPA redirect |

---

## Test Result After Healing
- **Status:** PASSED ✅
- **Duration:** 8.5s (total suite: 9.8s)
- **Browser:** Chromium
