const { test, expect } = require('@playwright/test');

test.describe('TC-001: Add Element', () => {
  test('should add one Delete button when Add Element is clicked', async ({ page }) => {
    console.log('Navigating to Add/Remove Elements page');
    await page.goto('/add_remove_elements/');

    console.log('Clicking Add Element once');
    await page.click('button[onclick="addElement()"]');

    const deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(1);
    await expect(deleteButtons.nth(0)).toHaveText('Delete');
  });
});
