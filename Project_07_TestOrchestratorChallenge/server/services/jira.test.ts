import assert from 'node:assert/strict';
import { projectJql, toJql } from './jira.service.js';

const cases: { name: string; run: () => void }[] = [
    {
        name: 'a bare issue key becomes a key lookup',
        run: () => assert.equal(toJql('SCRUM-5'), 'key in (SCRUM-5)'),
    },
    {
        name: 'several issue keys become one key lookup',
        run: () => assert.equal(toJql('SCRUM-5, SCRUM-3'), 'key in (SCRUM-5, SCRUM-3)'),
    },
    {
        name: 'space-separated issue keys work too',
        run: () => assert.equal(toJql('SCRUM-5 SCRUM-3'), 'key in (SCRUM-5, SCRUM-3)'),
    },
    {
        name: 'a bare project key becomes a project query',
        run: () => assert.equal(toJql('SCRUM'), 'project = "SCRUM" ORDER BY updated DESC'),
    },
    {
        name: 'real JQL passes through untouched',
        run: () => {
            const jql = 'project = SCRUM AND status != Done ORDER BY updated DESC';
            assert.equal(toJql(jql), jql);
        },
    },
    {
        name: 'JQL using IN passes through untouched',
        run: () => {
            const jql = 'key in (SCRUM-1, SCRUM-2)';
            assert.equal(toJql(jql), jql);
        },
    },
    {
        name: 'a trailing semicolon is trimmed',
        run: () => assert.equal(toJql('SCRUM-5;'), 'key in (SCRUM-5)'),
    },
    {
        name: 'the project box accepts an issue key',
        run: () => assert.equal(projectJql('SCRUM-5'), 'key = SCRUM-5'),
    },
    {
        name: 'the project box still builds a filtered project query',
        run: () =>
            assert.equal(
                projectJql('SCRUM'),
                'project = "SCRUM" AND issuetype in (Story, Task, Bug) ORDER BY updated DESC'
            ),
    },
    {
        name: 'unrecognised input is handed to Jira verbatim',
        run: () => assert.equal(toJql('some free text'), 'some free text'),
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
