const { spawnSync } = require('child_process');
const path = require('path');
const { parseResults } = require('./mcp_scripts/parse_results');
const { createJiraTickets, isRealJira } = require('./mcp_scripts/create_jira_tickets');

const projectDir = path.resolve(__dirname);
const configPath = path.resolve(projectDir, 'playwright.config.js');

function runPlaywrightTests() {
  console.log('\n--- Step 3: Running Playwright Tests ---\n');
  const command = `npx playwright test --config "${configPath}"`;
  const result = spawnSync(command, {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    console.log('\n  Playwright tests completed with failures, continuing pipeline.');
  }
}

async function runPipeline() {
  console.log('\n=== aProject_05 STLC Automation Pipeline ===\n');
  console.log('  Test plan: aProject_05/deliverables/test_plan.md');

  runPlaywrightTests();
  const results = parseResults();
  const tickets = await createJiraTickets(results.failures);

  console.log('\n=== Pipeline Summary ===');
  console.log(`  Total tests: ${results.total}`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  console.log(`  Jira tickets created: ${tickets.length}`);
  if (tickets.length) {
    console.log(`  Ticket keys: ${tickets.join(', ')}`);
  }
  console.log('  HTML report: aProject_05/deliverables/reports/html-report/index.html');
  console.log('  JSON report: aProject_05/deliverables/reports/results.json');
  if (!isRealJira) {
    console.log('\nRun the mock Jira server before creating Jira tickets:');
    console.log('  node stlc_project/jira_mock/jira_mock_server.js');
  }
}

runPipeline().catch((error) => {
  console.error('\nPipeline failed:', error.message);
  process.exit(1);
});
