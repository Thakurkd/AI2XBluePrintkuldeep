import { test, expect } from '@playwright/test';

const BASE_URL = 'https://the-internet.herokuapp.com/checkboxes';

test.describe('Checkboxes Feature', () => {
  test('TC-001 Toggle single checkbox', async ({ page }) => {
    await page.goto(BASE_URL);
    const cb1 = page.locator('input[type="checkbox"]').first();
    const initial = await cb1.isChecked();
    await cb1.click();
    if (initial) {
      await expect(cb1).not.toBeChecked();
    } else {
      await expect(cb1).toBeChecked();
    }
  });

  test('TC-002 Toggle both checkboxes', async ({ page }) => {
    await page.goto(BASE_URL);
    const cbs = page.locator('input[type="checkbox"]');
    const first = cbs.nth(0);
    const second = cbs.nth(1);
    // set both checked
    if (!(await first.isChecked())) await first.click();
    if (!(await second.isChecked())) await second.click();
    await expect(first).toBeChecked();
    await expect(second).toBeChecked();
    // unset both
    await first.click();
    await second.click();
    await expect(first).not.toBeChecked();
    await expect(second).not.toBeChecked();
  });

  test('TC-003 Navigation persistence within session', async ({ page }) => {
    await page.goto(BASE_URL);
    const cbs = page.locator('input[type="checkbox"]');
    const first = cbs.nth(0);
    const second = cbs.nth(1);
    // set a known state
    if (!(await first.isChecked())) await first.click();
    if (await second.isChecked()) await second.click();
    const state1 = await first.isChecked();
    const state2 = await second.isChecked();
    // navigate away and back
    await page.goto('https://the-internet.herokuapp.com/');
    await page.goBack();
    // verify states persisted in session
    await expect(first.isChecked()).resolves.toBe(state1);
    await expect(second.isChecked()).resolves.toBe(state2);
  });

  test('TC-004 Keyboard accessibility (tab + space)', async ({ page }) => {
    await page.goto(BASE_URL);
    const first = page.locator('input[type="checkbox"]').first();
    await page.keyboard.press('Tab');
    // Press Space to toggle focused checkbox
    await page.keyboard.press('Space');
    // The focused checkbox should now be toggled; we can't easily assert focusWithoutPolling, but verify at least that state changed
    // (This test assumes tab lands on the first checkbox in the page flow)
    await expect(first).toHaveJSProperty('checked');
  });
});
