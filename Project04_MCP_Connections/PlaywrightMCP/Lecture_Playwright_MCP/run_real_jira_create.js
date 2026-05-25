const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', '..', '.vscode', 'mcp.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const env = config.servers['mcp-atlassian'] && config.servers['mcp-atlassian'].env;
if (!env) {
  console.error('Missing mcp-atlassian env configuration in .vscode/mcp.json');
  process.exit(1);
}

process.env.JIRA_URL = env.JIRA_URL;
process.env.JIRA_EMAIL = env.JIRA_EMAIL || env.JIRA_USERNAME;
process.env.JIRA_API_TOKEN = env.JIRA_API_TOKEN;

const { createJiraTickets } = require('./stlc_project/mcp_scripts/05_create_jira_tickets');

const sampleFailures = [
  { title: 'should verify broken image returns 200 status', file: '07_broken_link.spec.js', error: 'Expected 200, received 404', duration: 1200 },
  { title: 'should have correct page title', file: '08_wrong_title.spec.js', error: 'Expected "Wrong Title", received "The Internet"', duration: 800 },
];

createJiraTickets(sampleFailures).catch((err) => {
  console.error('Error creating Jira tickets:', err);
  process.exit(1);
});
