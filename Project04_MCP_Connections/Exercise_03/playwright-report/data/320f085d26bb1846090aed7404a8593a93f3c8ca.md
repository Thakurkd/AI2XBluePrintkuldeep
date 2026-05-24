# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\checkboxes.spec.ts >> Checkboxes Feature >> TC-004 Keyboard accessibility (tab + space)
- Location: tests\checkboxes.spec.ts:53:7

# Error details

```
Error: expect(locator).toHaveJSProperty(expected) failed

Locator:  locator('input[type="checkbox"]').first()
Expected: undefined
Received: false
Timeout:  5000ms

Call log:
  - Expect "toHaveJSProperty" with timeout 5000ms
  - waiting for locator('input[type="checkbox"]').first()
    14 × locator resolved to <input type="checkbox"/>
       - unexpected value "false"

```

```yaml
- checkbox
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'https://the-internet.herokuapp.com/checkboxes';
  4  | 
  5  | test.describe('Checkboxes Feature', () => {
  6  |   test('TC-001 Toggle single checkbox', async ({ page }) => {
  7  |     await page.goto(BASE_URL);
  8  |     const cb1 = page.locator('input[type="checkbox"]').first();
  9  |     const initial = await cb1.isChecked();
  10 |     await cb1.click();
  11 |     if (initial) {
  12 |       await expect(cb1).not.toBeChecked();
  13 |     } else {
  14 |       await expect(cb1).toBeChecked();
  15 |     }
  16 |   });
  17 | 
  18 |   test('TC-002 Toggle both checkboxes', async ({ page }) => {
  19 |     await page.goto(BASE_URL);
  20 |     const cbs = page.locator('input[type="checkbox"]');
  21 |     const first = cbs.nth(0);
  22 |     const second = cbs.nth(1);
  23 |     // set both checked
  24 |     if (!(await first.isChecked())) await first.click();
  25 |     if (!(await second.isChecked())) await second.click();
  26 |     await expect(first).toBeChecked();
  27 |     await expect(second).toBeChecked();
  28 |     // unset both
  29 |     await first.click();
  30 |     await second.click();
  31 |     await expect(first).not.toBeChecked();
  32 |     await expect(second).not.toBeChecked();
  33 |   });
  34 | 
  35 |   test('TC-003 Navigation persistence within session', async ({ page }) => {
  36 |     await page.goto(BASE_URL);
  37 |     const cbs = page.locator('input[type="checkbox"]');
  38 |     const first = cbs.nth(0);
  39 |     const second = cbs.nth(1);
  40 |     // set a known state
  41 |     if (!(await first.isChecked())) await first.click();
  42 |     if (await second.isChecked()) await second.click();
  43 |     const state1 = await first.isChecked();
  44 |     const state2 = await second.isChecked();
  45 |     // navigate away and back
  46 |     await page.goto('https://the-internet.herokuapp.com/');
  47 |     await page.goBack();
  48 |     // verify states persisted in session
  49 |     await expect(first.isChecked()).resolves.toBe(state1);
  50 |     await expect(second.isChecked()).resolves.toBe(state2);
  51 |   });
  52 | 
  53 |   test('TC-004 Keyboard accessibility (tab + space)', async ({ page }) => {
  54 |     await page.goto(BASE_URL);
  55 |     const first = page.locator('input[type="checkbox"]').first();
  56 |     await page.keyboard.press('Tab');
  57 |     // Press Space to toggle focused checkbox
  58 |     await page.keyboard.press('Space');
  59 |     // The focused checkbox should now be toggled; we can't easily assert focusWithoutPolling, but verify at least that state changed
  60 |     // (This test assumes tab lands on the first checkbox in the page flow)
> 61 |     await expect(first).toHaveJSProperty('checked');
     |                         ^ Error: expect(locator).toHaveJSProperty(expected) failed
  62 |   });
  63 | });
  64 | 
```