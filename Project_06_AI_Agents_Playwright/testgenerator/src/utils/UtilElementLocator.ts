import { expect, Locator, Page } from '@playwright/test';
import { createLogger, type Logger } from '@utils/logger.js';

export const DEFAULT_ACTION_TIMEOUT_MS = 15_000;

export type Flex = string | Locator;

export class UtilElementLocator {
    private readonly page: Page;
    private readonly log: Logger;

    constructor(page: Page, scope: string = 'UtilElementLocator') {
        this.page = page;
        this.log = createLogger(scope);
    }

    private toLocator(target: Flex): Locator {
        return typeof target === 'string' ? this.page.locator(target) : target;
    }

    private describe(target: Flex): string {
        return typeof target === 'string' ? target : target.toString();
    }

    async click(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`click ${this.describe(target)}`);
        await loc.click({ timeout });
    }

    async fill(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        this.log.debug(`fill ${this.describe(target)}`);
        await loc.fill(value, { timeout });
    }

    async getText(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        const txt = (await loc.textContent()) ?? '';
        return txt.trim();
    }

    async getInnerText(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        return (await loc.innerText()).trim();
    }

    async isVisible(target: Flex): Promise<boolean> {
        const loc = this.toLocator(target);
        return loc.isVisible();
    }

    async waitForVisible(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        await expect(loc).toBeVisible({ timeout });
    }

    async waitForHidden(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        await expect(loc).toBeHidden({ timeout });
    }

    async getValue(target: Flex): Promise<string> {
        const loc = this.toLocator(target);
        return loc.inputValue();
    }

    async clear(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        const loc = this.toLocator(target);
        await loc.clear({ timeout });
    }
}
