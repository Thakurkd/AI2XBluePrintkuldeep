import assert from 'node:assert/strict';
import { repairGeneratedCode } from './codeRepair';

const cases: { name: string; run: () => void }[] = [
    {
        name: 'adds a Page type import the model annotated with but omitted',
        run: () => {
            const input = [
                `import { test, expect } from '@playwright/test';`,
                `class LoginPage {`,
                `  readonly page: Page;`,
                `}`,
            ].join('\n');
            const out = repairGeneratedCode(input, 'playwright', 'typescript');
            assert.match(out, /import \{ test, expect, Page \} from '@playwright\/test';/);
        },
    },
    {
        name: 'adds only the types actually referenced',
        run: () => {
            const input = [
                `import { test } from '@playwright/test';`,
                `const find = (p: Page): Locator => p.locator('x');`,
            ].join('\n');
            const out = repairGeneratedCode(input, 'playwright', 'typescript');
            assert.match(out, /import \{ test, Page, Locator \} from '@playwright\/test';/);
            assert.doesNotMatch(out, /BrowserContext/);
        },
    },
    {
        name: 'leaves a correct import untouched',
        run: () => {
            const input = [
                `import { test, expect, Page } from '@playwright/test';`,
                `class LoginPage { readonly page: Page; }`,
            ].join('\n');
            assert.equal(repairGeneratedCode(input, 'playwright', 'typescript'), input);
        },
    },
    {
        name: 'drops an import of a class defined in the same file',
        run: () => {
            const input = [
                `import { test, expect } from '@playwright/test';`,
                `import { LoginPage } from './LoginPage';`,
                `class LoginPage {}`,
                `test('x', async () => { new LoginPage(); });`,
            ].join('\n');
            const out = repairGeneratedCode(input, 'playwright', 'typescript');
            assert.doesNotMatch(out, /from '\.\/LoginPage'/);
            assert.match(out, /class LoginPage \{\}/);
        },
    },
    {
        name: 'keeps a relative import of something not defined here',
        run: () => {
            const input = [
                `import { helper } from './helpers';`,
                `class LoginPage {}`,
            ].join('\n');
            assert.equal(repairGeneratedCode(input, 'playwright', 'typescript'), input);
        },
    },
    {
        name: 'leaves non-JS languages alone',
        run: () => {
            const input = `public class LoginTest { private WebDriver driver; }`;
            assert.equal(repairGeneratedCode(input, 'selenium', 'java'), input);
        },
    },
];

let failed = 0;
for (const { name, run } of cases) {
    try {
        run();
        console.log(`  ok   ${name}`);
    } catch (error) {
        failed++;
        console.error(`  FAIL ${name}\n       ${(error as Error).message.split('\n')[0]}`);
    }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
