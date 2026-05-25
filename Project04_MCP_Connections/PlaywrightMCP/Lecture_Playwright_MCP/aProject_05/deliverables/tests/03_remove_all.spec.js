const { test, expect } = require('@playwright/test');

test.describe('TC-003: Remove Elements', () => {
  test('should remove all Delete buttons after adding two', async ({ page }) => {
    console.log('Opening Add/Remove Elements page');
    await page.goto('/add_remove_elements/');

    console.log('Adding two Delete buttons');
    await page.click('button[onclick="addElement()"]');
    await page.click('button[onclick="addElement()"]');

    const deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(2);

    console.log('Removing both Delete buttons');
    await deleteButtons.nth(0).click();
    await deleteButtons.nth(0).click();

    await expect(page.locator('button.added-manually')).toHaveCount(0);
  });
});
