import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * VWOLoginPage - Page Object for the VWO login screen at https://app.vwo.com
 *
 * Discovered locators (verified against live DOM on 2026-06-02):
 *   emailInput        -> #login-username   (type=email, placeholder="Enter email ID")
 *   passwordInput     -> #login-password   (type=password, placeholder="Enter password")
 *   loginButton       -> #js-login-btn     (type=submit, text="Sign in")
 *   inlineEmailError  -> #js-login-form span.invalid-reason  (visible when email format invalid, text="Invalid email")
 *   notificationError -> #js-notification-box-msg            (visible after bad credentials, text="Your email, password, IP address or location did not match")
 */

export class VWOLoginPage extends BasePage {
    static readonly PATH = 'https://app.vwo.com/#/login';

    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    /**
     * Inline field-level error shown when the email address format is invalid
     * (e.g. missing @ symbol). Scoped to #js-login-form to avoid matching
     * the same span that appears in other hidden form blocks.
     */
    private readonly inlineEmailError: Locator;

    /**
     * Notification banner shown after a failed authentication attempt
     * (wrong password, unknown account, IP block, etc.).
     * Selector: #js-notification-box-msg
     */
    private readonly notificationError: Locator;

    constructor(page: Page) {
        super(page, 'VWOLoginPage');
        this.emailInput        = page.locator('#login-username');
        this.passwordInput     = page.locator('#login-password');
        this.loginButton       = page.locator('#js-login-btn');
        this.inlineEmailError  = page.locator('#js-login-form span.invalid-reason');
        this.notificationError = page.locator('#js-notification-box-msg');
    }

    async open(): Promise<void> {
        await this.goto(VWOLoginPage.PATH);
    }

    /**
     * Fill credentials and click Sign in.
     * Uses standard Playwright fill — adequate for valid email addresses
     * (the HTML5 type=email input accepts them normally).
     */
    async loginAs(email: string, password: string): Promise<void> {
        this.log.info(`loginAs ${email}`);
        await this.el.fill(this.emailInput, email);
        await this.el.fill(this.passwordInput, password);
        await this.el.click(this.loginButton);
    }

    /**
     * Submits a malformed email value (one that fails the HTML5 type=email
     * constraint) together with a password so the AngularJS form validator
     * can surface the inline "Invalid email" error span.
     *
     * Because Playwright's page.fill() on an <input type="email"> silently
     * refuses to set a value that does not match the browser's email regex,
     * we bypass the native setter via a JS evaluate, fire the AngularJS
     * input/change events, then click Sign in.
     */
    async submitWithInvalidEmailFormat(email: string, password: string): Promise<void> {
        this.log.info(`submitWithInvalidEmailFormat email="${email}"`);
        // pressSequentially types character-by-character, bypassing the browser's
        // HTML5 type=email native constraint check so AngularJS validation fires.
        await this.emailInput.pressSequentially(email);
        await this.el.fill(this.passwordInput, password);
        await this.el.click(this.loginButton);
    }

    /**
     * Returns the inline field-level error message text (e.g. "Invalid email").
     * This error is rendered by the AngularJS form validator and appears
     * directly beneath the email input when the HTML5 email pattern check fails.
     */
    async getInlineEmailError(): Promise<string> {
        return this.el.getInnerText(this.inlineEmailError);
    }

    /**
     * Returns the notification banner error text shown after a failed login
     * (e.g. "Your email, password, IP address or location did not match").
     */
    async getNotificationError(): Promise<string> {
        return this.el.getInnerText(this.notificationError);
    }
}
