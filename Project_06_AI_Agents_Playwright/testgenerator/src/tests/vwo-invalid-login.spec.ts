import { test, expect } from '@playwright/test';
import { VWOLoginPage } from '@pages/VWOLoginPage.js';
import { createLogger } from '@utils/logger.js';

const log = createLogger('vwo-invalid-login.spec');

/**
 * VWO Invalid Login tests
 *
 * Two scenarios that do NOT require valid VWO credentials:
 *
 *   TC-01 — Malformed email (no @ symbol)
 *     The browser's HTML5 type=email validation would normally silently block
 *     the submit, so we bypass the native setter via VWOLoginPage
 *     .submitWithInvalidEmailFormat(). The AngularJS form validator then
 *     surfaces an inline error: "Invalid email".
 *
 *   TC-02 — Valid email format, wrong password
 *     The form passes client-side validation and the request reaches the VWO
 *     server. The server responds with a notification banner:
 *     "Your email, password, IP address or location did not match".
 *
 * Tags: @p1 @smoke  (run in both quick-smoke and nightly-regression sweeps)
 */

test.describe('VWO - Invalid Login', () => {
    let loginPage: VWOLoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new VWOLoginPage(page);
        await test.step('Open the VWO login page', async () => {
            log.info('Opening the VWO login page');
            await loginPage.open();
        });
    });

    // -------------------------------------------------------------------------
    // TC-01: Malformed email — no @ symbol
    // -------------------------------------------------------------------------
    test('shows inline error for invalid email format @p1 @smoke', async () => {
        await test.step('Submit login form with a malformed email (no @ symbol)', async () => {
            log.info('Calling submitWithInvalidEmailFormat with "invalidemail"');
            await loginPage.submitWithInvalidEmailFormat('invalidemail', 'anypassword123');
        });

        await test.step('Assert inline "Invalid email" error is visible beneath the email field', async () => {
            log.info('Asserting inline email validation error text');
            const errorText = await loginPage.getInlineEmailError();
            log.info(`Inline error text received: "${errorText}"`);
            expect(errorText).toBe('Invalid email');
        });
    });

    // -------------------------------------------------------------------------
    // TC-02: Valid email format, wrong password
    // -------------------------------------------------------------------------
    test('shows notification error for wrong password @p1 @smoke', async ({ page }) => {
        await test.step('Submit login form with a valid email and an incorrect password', async () => {
            log.info('Calling loginAs with test@example.com and wrong password');
            await loginPage.loginAs('test@example.com', 'wrongpassword123');
        });

        await test.step('Wait for the notification error banner to become visible', async () => {
            log.info('Waiting for notification error banner (#js-notification-box-msg)');
            await expect(page.locator('#js-notification-box-msg')).toBeVisible({ timeout: 10_000 });
        });

        await test.step('Assert notification error message text', async () => {
            log.info('Asserting notification error text');
            const errorText = await loginPage.getNotificationError();
            log.info(`Notification error text received: "${errorText}"`);
            expect(errorText).toBe(
                'Your email, password, IP address or location did not match',
            );
        });
    });
});
