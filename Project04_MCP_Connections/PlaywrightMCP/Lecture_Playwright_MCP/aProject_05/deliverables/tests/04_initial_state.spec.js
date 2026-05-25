const { test, expect } = require('@playwright/test');

test.describe('TC-004: Initial Page State', () => {
  test('should load with zero Delete buttons', async ({ page }) => {
    console.log('Navigating to Add/Remove Elements page');
    await page.goto('/add_remove_elements/');

    const deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(0);
  });
});
