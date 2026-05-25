const fs = require('fs');
const path = require('path');

const mcpPath = path.join(__dirname, '..', '..', '..', '.vscode', 'mcp.json');
const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
const env = mcp.servers['mcp-atlassian'] && mcp.servers['mcp-atlassian'].env;
if (!env) {
  console.error('Unable to read mcp-atlassian config from', mcpPath);
  process.exit(1);
}
const url = env.JIRA_URL;
const email = env.JIRA_EMAIL || env.JIRA_USERNAME;
const token = env.JIRA_API_TOKEN;
const projectKey = 'SCRUM';

if (!url || !email || !token) {
  console.error('Missing JIRA_URL, JIRA_EMAIL/JIRA_USERNAME, or JIRA_API_TOKEN');
  process.exit(1);
}

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const summary = 'Mock Bug: Jira MCP integration test';
const description = `*This is a mock bug created through Jira MCP integration.*\n\nTest created on ${new Date().toISOString()}`;
const body = {
  fields: {
    project: { key: projectKey },
    summary,
    description,
    issuetype: { name: 'Task' },
    priority: { name: 'Medium' },
    labels: ['mock-bug', 'jira-mcp', `run-date-${new Date().toISOString().slice(0, 10)}`],
  },
};

(async () => {
  try {
    const res = await fetch(`${url}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error('Failed to create issue:', res.status, res.statusText);
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
    console.log('Created issue:', result.key);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error creating issue:', err.message);
    process.exit(1);
  }
})();
