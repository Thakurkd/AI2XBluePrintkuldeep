import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class VWOLoginPage extends BasePage {
    static readonly PATH = 'https://app.vwo.com/#/login';

    private readonly emailInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly notificationError: Locator;

    constructor(page: Page) {
        super(page, 'VWOLoginPage');
        this.emailInput        = page.locator('#login-username');
        this.passwordInput     = page.locator('#login-password');
        this.loginButton       = page.locator('#js-login-btn');
        this.notificationError = page.locator('#js-notification-box-msg');
    }

    async open(): Promise<void> {
        await this.goto(VWOLoginPage.PATH);
        await this.el.waitForVisible(this.loginButton);
    }

    async loginAs(email: string, password: string): Promise<void> {
        this.log.info(`loginAs ${email}`);
        await this.el.fill(this.emailInput, email);
        await this.el.fill(this.passwordInput, password);
        await this.el.click(this.loginButton);
    }

    async getNotificationError(): Promise<string> {
        return this.el.getInnerText(this.notificationError);
    }
}
