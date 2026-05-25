const { test, expect } = require('@playwright/test');

test.describe('TC-002: Add and Remove Elements', () => {
  test('should add three Delete buttons and remove one', async ({ page }) => {
    console.log('Going to Add/Remove Elements page');
    await page.goto('/add_remove_elements/');

    for (let i = 0; i < 3; i++) {
      console.log(`Clicking Add Element ${i + 1}`);
      await page.click('button[onclick="addElement()"]');
    }

    let deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(3);

    console.log('Removing one Delete button');
    await deleteButtons.nth(0).click();

    deleteButtons = page.locator('button.added-manually');
    await expect(deleteButtons).toHaveCount(2);
  });
});
