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
        this.log.debug(`click ${this.describe(target)}`);
        await this.toLocator(target).click({ timeout });
    }

    async fill(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        this.log.debug(`fill ${this.describe(target)}`);
        await this.toLocator(target).fill(value, { timeout });
    }

    async getInnerText(target: Flex): Promise<string> {
        return (await this.toLocator(target).innerText()).trim();
    }

    async waitForVisible(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
        await expect(this.toLocator(target)).toBeVisible({ timeout });
    }
}
