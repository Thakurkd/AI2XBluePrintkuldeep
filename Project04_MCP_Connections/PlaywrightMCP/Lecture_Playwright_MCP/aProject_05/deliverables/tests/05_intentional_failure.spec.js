const { test, expect } = require('@playwright/test');

test.describe('TC-005: Intentional Failure', () => {
  test('should intentionally fail by expecting two Delete buttons for one click', async ({ page }) => {
    console.log('Opening Add/Remove Elements page');
    await page.goto('/add_remove_elements/');

    console.log('Clicking Add Element once');
    await page.click('button[onclick="addElement()"]');

    const deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(2);
  });
});
