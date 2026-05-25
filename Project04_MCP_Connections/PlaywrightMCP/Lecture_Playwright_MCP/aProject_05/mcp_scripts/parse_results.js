const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(__dirname, '..', 'deliverables', 'reports', 'results.json');

function parseResults() {
  console.log('\n--- Step 4: Parsing Test Results ---\n');

  if (!fs.existsSync(resultsPath)) {
    console.log('  ERROR: results.json not found. Run tests first.');
    return { total: 0, passed: 0, failed: 0, failures: [] };
  }

  const report = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const failures = [];
  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const suite of report.suites || []) {
    for (const innerSuite of suite.suites || []) {
      for (const spec of innerSuite.specs || []) {
        total++;
        const result = spec.tests?.[0]?.results?.[0];
        if (result?.status === 'passed' || spec.ok) {
          passed++;
        } else {
          failed++;
          failures.push({
            title: spec.title,
            file: suite.file || 'unknown',
            error: result?.error?.message || 'Unknown error',
            duration: result?.duration || 0,
          });
        }
      }
    }
  }

  console.log(`  Total tests:  ${total}`);
  console.log(`  Passed:       ${passed}`);
  console.log(`  Failed:       ${failed}`);

  if (failures.length) {
    console.log('\n  Failed tests:');
    failures.forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.title}`);
      console.log(`       File: ${f.file}`);
      console.log(`       Error: ${f.error.substring(0, 120)}`);
    });
  }

  return { total, passed, failed, failures };
}

if (require.main === module) {
  parseResults();
}

module.exports = { parseResults };
