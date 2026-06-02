import { test, expect } from '@playwright/test';
import { VWOLoginPage } from '@pages/VWOLoginPage.js';
import { createLogger } from '@utils/logger.js';

const log = createLogger('vwo-wrong-password.spec');

test.describe('VWO - Invalid Login', () => {
    let loginPage: VWOLoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new VWOLoginPage(page);
        await test.step('Open the VWO login page', async () => {
            log.info('Opening the VWO login page');
            await loginPage.open();
        });
    });

    // TC-02: Valid email format, wrong password
    test('shows notification error for wrong password @p1 @smoke', async ({ page }) => {
        await test.step('Submit login form with valid email and wrong password', async () => {
            log.info('Calling loginAs with test@example.com and wrong password');
            await loginPage.loginAs('test@example.com', 'wrongpassword123');
        });

        await test.step('Wait for the notification error banner to become visible', async () => {
            log.info('Waiting for notification error banner');
            await expect(page.locator('#js-notification-box-msg')).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Assert notification error message text', async () => {
            log.info('Asserting notification error text');
            const errorText = await loginPage.getNotificationError();
            log.info(`Notification error text received: "${errorText}"`);
            expect(errorText).toBe('Your email, password, IP address or location did not match');
        });
    });
});
