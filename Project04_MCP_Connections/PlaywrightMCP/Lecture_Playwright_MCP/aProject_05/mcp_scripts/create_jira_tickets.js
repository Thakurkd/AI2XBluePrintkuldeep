const fs = require('fs');
const path = require('path');

// Look for .vscode/mcp.json up the directory tree
function loadMcpConfig() {
  let currentDir = __dirname;
  while (true) {
    const mcpPath = path.join(currentDir, '.vscode', 'mcp.json');
    if (fs.existsSync(mcpPath)) {
      try {
        const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
        const env = mcp.servers['mcp-atlassian'] && mcp.servers['mcp-atlassian'].env;
        if (env) {
          return env;
        }
      } catch (err) {
        console.error('Error reading mcp.json:', err.message);
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }
  return null;
}

const mcpEnv = loadMcpConfig();

// Dynamically determine configuration from environment variables or mcp.json
const jiraBaseUrl = process.env.JIRA_BASE_URL || (mcpEnv && mcpEnv.JIRA_URL) || 'http://localhost:3001';
const jiraEmail = process.env.JIRA_EMAIL || process.env.JIRA_USERNAME || (mcpEnv && (mcpEnv.JIRA_EMAIL || mcpEnv.JIRA_USERNAME)) || '';
const jiraApiToken = process.env.JIRA_API_TOKEN || (mcpEnv && mcpEnv.JIRA_API_TOKEN) || '';

// Use real Jira if we have email and API token and are not pointing to localhost
const isRealJira = !!(jiraEmail && jiraApiToken) && !jiraBaseUrl.includes('localhost') && !jiraBaseUrl.includes('127.0.0.1');

const jiraProjectKey = process.env.JIRA_PROJECT_KEY || (isRealJira ? 'SCRUM' : 'STLC');
const jiraIssueType = process.env.JIRA_ISSUE_TYPE || (isRealJira ? 'Task' : 'Bug');

// Construct fetch headers
const headers = { 'Content-Type': 'application/json' };
if (jiraEmail && jiraApiToken) {
  const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
  headers['Authorization'] = `Basic ${auth}`;
}

async function createIssueForFailure(failure) {
  const payload = {
    fields: {
      project: { key: jiraProjectKey },
      summary: isRealJira ? `Test Failure: ${failure.title}` : `Mock Bug: ${failure.title}`,
      description: `Automated failure report:\n\nTest: ${failure.title}\nFile: ${failure.file}\nDuration: ${failure.duration}ms\n\nError:\n${failure.error}`,
      issuetype: { name: jiraIssueType },
      priority: { name: 'Medium' },
      labels: isRealJira 
        ? ['automation', 'regression', 'playwright', `run-date-${new Date().toISOString().slice(0, 10)}`]
        : ['mock-bug', 'add-remove-elements', `run-date-${new Date().toISOString().slice(0, 10)}`],
    },
  };

  const response = await fetch(`${jiraBaseUrl}/rest/api/2/issue`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payloadText = await response.text();
    throw new Error(`Failed to create Jira ticket: ${response.status} ${response.statusText} ${payloadText}`);
  }

  return response.json();
}

async function createJiraTickets(failures) {
  console.log('\n--- Step 5: Creating Jira Tickets ---\n');
  if (isRealJira) {
    console.log(`  Connecting to real Jira instance at: ${jiraBaseUrl}`);
    console.log(`  Target Project: ${jiraProjectKey} | Issue Type: ${jiraIssueType}\n`);
  } else {
    console.log(`  Connecting to mock Jira server at: ${jiraBaseUrl}\n`);
  }

  if (!failures || failures.length === 0) {
    console.log('  No failures found. No Jira tickets created.');
    return [];
  }

  const created = [];
  for (const failure of failures) {
    try {
      const issue = await createIssueForFailure(failure);
      console.log(`  Created issue: ${issue.key} - ${failure.title}`);
      created.push(issue.key);
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }

  console.log(`\n  Total Jira tickets created: ${created.length}`);
  return created;
}

if (require.main === module) {
  console.error('This script is intended to be used from the pipeline.');
}

module.exports = { createJiraTickets, isRealJira };
