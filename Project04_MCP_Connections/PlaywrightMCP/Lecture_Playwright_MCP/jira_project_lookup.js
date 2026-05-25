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
if (!url || !email || !token) {
  console.error('Missing JIRA_URL, JIRA_EMAIL/JIRA_USERNAME, or JIRA_API_TOKEN');
  process.exit(1);
}
const auth = Buffer.from(`${email}:${token}`).toString('base64');
(async () => {
  const res = await fetch(`${url}/rest/api/2/project/search`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error('Project lookup failed:', res.status, res.statusText);
    console.error(body);
    process.exit(1);
  }
  const json = JSON.parse(body);
  console.log(JSON.stringify(json, null, 2));
})();
