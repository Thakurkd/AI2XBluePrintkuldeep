# GitHub with Google Antigravity & VS Code with GitHub Copilot — Complete QA Tutorial

### The Ultimate Guide to AI-Powered GitHub Workflows for QA Engineers & SDETs

**Covering:** GitHub MCP Setup · PR Automation · Issue Management · Agent Mode · Copilot Chat · Slash Commands · Custom Instructions · Troubleshooting

---

**Created by: Pramod Dutta**
SDET Manager at Tekion | Ex BrowserStack | CSM® Certified Scrum Master
10+ Years in Software Testing & Test Automation | Mentored 10,000+ Students
Founder — [TheTestingAcademy.com](https://thetestingacademy.com)
LinkedIn — [linkedin.com/in/pramoddutta](https://www.linkedin.com/in/pramoddutta/)
YouTube — 150K+ Subscribers | Instagram — 100K+ Followers

---

## Agenda — What You Will Learn

This tutorial is divided into **two major parts** with **18 modules total**. By the end, you will be able to connect GitHub directly inside your AI IDE, automate your entire QA workflow — from finding bugs to filing issues to pushing test code — and use Copilot to generate, fix, and review tests without leaving VS Code.

### Part A: GitHub with Google Antigravity (Modules 1–9)

1. What is GitHub MCP and Why QA Engineers Need It
2. Prerequisites & Environment Setup
3. Installing GitHub MCP in Antigravity (Step-by-Step)
4. Generating a GitHub Personal Access Token (PAT)
5. Verifying the Connection & Available GitHub Tools
6. GitHub MCP Tools — Complete Reference with QA Prompts
7. Real QA Workflows — Issues, PRs, CI/CD, Code Review
8. Multi-Agent GitHub Workflows
9. Troubleshooting GitHub MCP in Antigravity

### Part B: VS Code with GitHub Copilot (Modules 10–18)

10. What is GitHub Copilot and Why QA Engineers Need It
11. Prerequisites & Installation in VS Code
12. Copilot Modes — Ask, Edit, and Agent Mode Explained
13. Keyboard Shortcuts & Slash Commands for QA
14. Context References — #file, @workspace, @terminal
15. Custom Instructions — copilot-instructions.md for QA
16. Agent Mode — Autonomous Multi-File Test Generation
17. Copilot Skills & Custom Agents for QA
18. Troubleshooting Copilot in VS Code

---

---

# PART A: GitHub with Google Antigravity

---

## Module 1: What is GitHub MCP and Why QA Engineers Need It

### 1.1 What is MCP?

MCP (Model Context Protocol) is an open standard that lets AI agents connect directly to external tools and services. Think of it as a "USB cable" between the AI inside your IDE and your GitHub account. Instead of copy-pasting issue descriptions or manually creating PRs, the AI agent talks to GitHub directly.

### 1.2 What is GitHub MCP Server?

The GitHub MCP Server is GitHub's official MCP server that provides 50+ tools for interacting with GitHub APIs. It lets AI agents inside Antigravity (or any MCP-compatible IDE) perform actions like creating issues, opening pull requests, reading repository files, searching code, and monitoring CI/CD workflows — all through natural language prompts.

### 1.3 Why QA Engineers Need This

Without GitHub MCP, a typical QA workflow looks like this:

1. Find a bug during testing
2. Switch to browser → open GitHub
3. Navigate to the repo → click "New Issue"
4. Manually type the bug title, description, steps, screenshots
5. Assign labels, milestone, assignee
6. Switch back to IDE → continue testing

With GitHub MCP inside Antigravity:

1. Find a bug during testing
2. Type: "Create a GitHub issue for the login page timeout bug I just found"
3. Done. The agent creates the issue with title, description, labels, and assignee.

That is the power. You never leave your IDE. The agent handles GitHub for you.

### 1.4 Key Capabilities for QA

- **Bug Reporting**: Agent creates GitHub issues with reproduction steps automatically
- **Test Code PRs**: Agent writes tests, commits to a branch, opens a PR
- **Code Review**: Agent reviews test PRs and leaves comments
- **CI/CD Monitoring**: Agent checks GitHub Actions workflow runs and reports failures
- **Repository Search**: Agent searches code across repos to find test patterns
- **Release Management**: Agent lists releases and tags for regression planning

---

## Module 2: Prerequisites & Environment Setup

### 2.1 What You Need Before Starting

| Requirement | Details |
|-------------|---------|
| Google Antigravity | Download from [antigravity.google](https://antigravity.google). macOS Monterey+, Windows 10+, or Linux. Free public preview with personal Gmail. |
| GitHub Account | Free account works. Pro/Team for private repos. |
| Git Installed | Required for local repository operations. |
| Node.js 18+ | Required if using Docker-based MCP setup. |
| Docker (Optional) | For containerized MCP server setup. |

### 2.2 Installing Google Antigravity

**macOS:**
1. Download the `.dmg` from [antigravity.google](https://antigravity.google)
2. Drag Antigravity to Applications
3. Open and sign in with your Gmail account
4. Select your preferred editor layout

**Windows:**
1. Download the `.exe` installer from [antigravity.google](https://antigravity.google)
2. Run the installer and follow prompts
3. Sign in with your Gmail account

**Linux:**
1. Download the `.AppImage` or `.deb` from [antigravity.google](https://antigravity.google)
2. Make executable: `chmod +x Antigravity-*.AppImage`
3. Run and sign in

### 2.3 Verify Git is Installed

Open your terminal inside Antigravity (`Ctrl+``) and run:

```bash
git --version
```

**Expected output:**
```
git version 2.43.0
```

> **If Git is NOT installed**, see Module 9: Troubleshooting for complete Git installation steps for all platforms.

### 2.4 Verify Node.js (For Docker-based Setup)

```bash
node --version
npm --version
```

**Expected output:**
```
v20.11.0
10.2.4
```

---

## Module 3: Installing GitHub MCP in Antigravity (Step-by-Step)

There are **two methods** to install GitHub MCP. We recommend **Method 1 (Remote Server)** as it is simpler and more reliable.

### 3.1 Method 1 — Remote Server (Recommended)

This method uses GitHub's hosted MCP server. No Docker needed. No local server to manage.

**Step 1:** Open Antigravity and click the three dots `...` at the top of the Agent Panel.

**Step 2:** Click **MCP Servers** → **Manage MCP Servers** → **View raw config**.

This opens the file:
```
~/.gemini/antigravity/mcp_config.json
```

**Step 3:** Add the following configuration:

```json
{
  "mcpServers": {
    "github": {
      "serverUrl": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_PAT"
      }
    }
  }
}
```

> **IMPORTANT:** Antigravity uses `serverUrl` (not `url`) for HTTP-based MCP servers. This is different from Cursor or other IDEs.

**Step 4:** Replace `YOUR_GITHUB_PAT` with your actual token (see Module 4).

**Step 5:** **Close and reopen Antigravity** completely for the changes to take effect.

**Step 6:** Open MCP Servers panel → you should see "github" listed with available tools.

### 3.2 Method 2 — Docker (Local Server)

If you prefer running the MCP server locally:

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    }
  }
}
```

> **Note:** The official MCP Store installation currently has known Docker errors. The manual configuration above is more reliable.

### 3.3 Method 3 — npx (Without Docker)

If you don't have Docker but have Node.js:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    }
  }
}
```

---

## Module 4: Generating a GitHub Personal Access Token (PAT)

### 4.1 Step-by-Step Token Creation

**Step 1:** Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)

**Step 2:** Click **"Generate new token"** → Select **"Fine-grained personal access token"** (recommended for security)

**Step 3:** Configure the token:

| Setting | Value |
|---------|-------|
| Token name | `antigravity-mcp-qa` |
| Expiration | 90 days (recommended) |
| Repository access | "All repositories" or select specific QA repos |

**Step 4:** Set permissions (minimum required for QA workflows):

| Permission | Access Level | Why You Need It |
|------------|-------------|-----------------|
| **Issues** | Read & Write | Create, update, comment on bug reports |
| **Pull Requests** | Read & Write | Create PRs, add review comments |
| **Contents** | Read & Write | Read files, push test code |
| **Actions** | Read only | Monitor CI/CD workflow runs |
| **Metadata** | Read only | Required for basic repo operations |

**Step 5:** Click **"Generate token"** and **copy it immediately** — you won't see it again.

**Step 6:** Paste the token into your `mcp_config.json` where it says `YOUR_GITHUB_PAT`.

### 4.2 Security Best Practices

- Never commit your PAT to a repository
- Set the shortest expiration you can manage (30–90 days)
- Use fine-grained tokens with minimum permissions
- Rotate tokens regularly
- If a token leaks, revoke it immediately at [github.com/settings/tokens](https://github.com/settings/tokens)

---

## Module 5: Verifying the Connection & Available GitHub Tools

### 5.1 Quick Verification

After restarting Antigravity, open the Agent Panel (`Cmd+L` / `Ctrl+L`) and type:

```
What GitHub tools are available to you? List them all.
```

The agent should respond with a list of 40-50+ tools. If it says "no GitHub tools available," see Module 9: Troubleshooting.

### 5.2 Test with a Simple Prompt

```
List my GitHub repositories
```

If the agent returns your repos, the connection is working.

### 5.3 Test Read Access

```
Read the README.md from my repo [your-username]/[your-repo-name]
```

### 5.4 Test Write Access

```
Create a test issue in [your-username]/[your-repo-name] with title "MCP Connection Test" 
and body "This issue was created by the Antigravity agent to verify GitHub MCP connectivity."
```

Go to your repo on GitHub — you should see the new issue. If yes, everything is working. Delete the test issue.

---

## Module 6: GitHub MCP Tools — Complete Reference with QA Prompts

### 6.1 Tool Categories

The GitHub MCP Server organizes tools into **toolsets**. You can enable specific toolsets for better performance:

| Toolset | Tools Included | QA Relevance |
|---------|---------------|-------------|
| `repos` | get_file_contents, create_or_update_file, push_files, create_branch, list_branches, list_commits, create_repository, fork_repository, search_repositories | Read test files, push test code, create feature branches |
| `issues` | create_issue, list_issues, update_issue, add_issue_comment, search_issues | Bug reporting, test tracking, defect management |
| `pull_requests` | create_pull_request, list_pull_requests, merge_pull_request, update_pull_request, get_pull_request_diff, get_pull_request_reviews | Test code PRs, code review, merge automation |
| `code_search` | search_code | Find test patterns, locate flaky tests across repos |
| `actions` | list_workflow_runs, get_workflow_run | Monitor CI/CD test runs, check build status |
| `code_security` | list_code_scanning_alerts, get_code_scanning_alert | Security testing, vulnerability tracking |

### 6.2 Limiting Toolsets for Better Performance

Antigravity recommends keeping total enabled tools under 50. For QA, configure your mcp_config.json with only what you need:

**Remote server (add header):**
```json
{
  "mcpServers": {
    "github": {
      "serverUrl": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_PAT",
        "X-MCP-Toolsets": "repos,issues,pull_requests,code_search,actions"
      }
    }
  }
}
```

**Docker (add environment variable):**
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e", "GITHUB_TOOLSETS=repos,issues,pull_requests,code_search,actions",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    }
  }
}
```

### 6.3 Complete Tool Reference for QA

#### Issues Tools

| Tool | What It Does | QA Prompt Example |
|------|-------------|-------------------|
| `create_issue` | Creates a new GitHub issue | `Create a bug report for the login timeout issue. Title: "Login page times out after 30 seconds on slow networks". Label it as "bug" and "priority-high". Assign to @qa-lead.` |
| `list_issues` | Lists issues in a repository | `Show me all open bugs labeled "flaky-test" in our test-automation repo` |
| `update_issue` | Updates an existing issue | `Close issue #42 with comment "Fixed in PR #58. Verified in regression run."` |
| `add_issue_comment` | Adds a comment to an issue | `Add a comment to issue #15: "Reproduced on Chrome 120 and Firefox 121. Steps confirmed."` |
| `search_issues` | Searches across all issues | `Search for all open issues mentioning "NoSuchElementException" across our org` |

#### Pull Request Tools

| Tool | What It Does | QA Prompt Example |
|------|-------------|-------------------|
| `create_pull_request` | Opens a new PR | `Create a PR from branch "feat/login-tests" to "main" with title "Add login page E2E tests" and description listing all new test cases.` |
| `list_pull_requests` | Lists PRs in a repo | `Show me all open PRs that modify files in the tests/ directory` |
| `merge_pull_request` | Merges a PR | `Merge PR #23 using squash merge after all checks pass` |
| `get_pull_request_diff` | Gets the diff of a PR | `Show me what changed in PR #45 — specifically the test files` |
| `add_review_comment` | Adds a review comment | `Add a review comment on PR #30: "This test needs an explicit assertion for the error message text."` |

#### Repository Tools

| Tool | What It Does | QA Prompt Example |
|------|-------------|-------------------|
| `get_file_contents` | Reads a file from the repo | `Read the playwright.config.ts from our e2e-tests repo` |
| `create_or_update_file` | Creates or updates a file | `Update the testng.xml to add a new "smoke" suite that includes LoginTest and HomePageTest` |
| `push_files` | Pushes multiple files | `Push the new page objects and test files I just created to branch "feat/checkout-tests"` |
| `create_branch` | Creates a new branch | `Create a branch called "test/sprint-42-regression" from main` |
| `search_code` | Searches code across repos | `Search for all usages of Thread.sleep() in our test automation repos` |

#### Actions Tools

| Tool | What It Does | QA Prompt Example |
|------|-------------|-------------------|
| `list_workflow_runs` | Lists CI/CD workflow runs | `Show me the last 5 workflow runs for our regression-tests pipeline. Are any failing?` |
| `get_workflow_run` | Gets details of a specific run | `Get the details and failure logs for workflow run #1234` |

---

## Module 7: Real QA Workflows — Issues, PRs, CI/CD, Code Review

### 7.1 Workflow 1: Bug Found → Issue Created (30 seconds)

**Scenario:** You find a bug during exploratory testing.

**Prompt:**
```
I found a bug on the checkout page. When I apply a discount code "SAVE20" and then remove 
an item from cart, the discount percentage applies to the old total, not the updated total.

Create a GitHub issue in pramoddutta/ecommerce-app with:
- Title: "Discount not recalculated after cart item removal"
- Labels: bug, priority-high, checkout
- Include reproduction steps, expected vs actual behavior
- Assign to @frontend-team
```

**What the agent does:**
1. Formats your description into a proper bug report
2. Calls `create_issue` with structured title, body, labels, and assignee
3. Returns the issue URL

### 7.2 Workflow 2: Agent Writes Tests → Pushes to Branch → Opens PR

**Scenario:** You want the agent to write E2E tests for a new feature and submit them as a PR.

**Step 1 — Create a branch:**
```
Create a branch called "test/checkout-discount-e2e" from main in pramoddutta/ecommerce-app
```

**Step 2 — Generate tests locally, then push:**
```
Write Playwright E2E tests for the checkout discount feature covering:
1. Apply valid discount code → verify total updates
2. Apply invalid discount code → verify error message
3. Apply discount → remove item → verify total recalculates
4. Apply discount → add item → verify total recalculates

Use POM pattern. Then push these files to the "test/checkout-discount-e2e" branch.
```

**Step 3 — Open PR:**
```
Create a PR from "test/checkout-discount-e2e" to "main" with:
- Title: "Add E2E tests for checkout discount feature"
- Description: List all 4 test scenarios with brief descriptions
- Request review from @qa-lead
```

### 7.3 Workflow 3: Monitor CI/CD and Report Failures

**Prompt:**
```
Check the status of our latest GitHub Actions workflow run for the "regression-tests" workflow 
in pramoddutta/ecommerce-app. If any tests failed, list the failing tests and create an issue 
for each failure with the error message and stack trace.
```

### 7.4 Workflow 4: Code Review on Test PRs

**Prompt:**
```
Review PR #55 in our test-automation repo. Check the test code for:
1. Missing assertions
2. Hardcoded test data instead of data providers
3. Use of Thread.sleep() instead of explicit waits
4. Missing Page Object patterns
5. Proper test naming conventions

Add review comments on each issue you find.
```

### 7.5 Workflow 5: Search for Anti-Patterns Across Repos

**Prompt:**
```
Search all repositories in our GitHub org "thetestingacademy" for these QA anti-patterns:
1. Thread.sleep() in Java test files
2. hardcoded URLs in test files
3. tests without any assertions
4. cy.wait() with numeric values in Cypress tests

List each finding with the file path and line content.
```

---

## Module 8: Multi-Agent GitHub Workflows

### 8.1 Using Antigravity Agent Manager for GitHub Workflows

Antigravity's Agent Manager lets you run multiple agents in parallel. This is powerful for QA + GitHub workflows.

**Example: QA Blitz with GitHub Integration**

Open Agent Manager and spawn 3 agents:

**Agent 1 — Bug Hunter:**
```
Review all changed files in PR #60. Identify potential bugs or edge cases 
that are not covered by existing tests. Create a GitHub issue for each finding.
```

**Agent 2 — Test Generator:**
```
For each new function added in PR #60, generate unit tests with at least 
80% branch coverage. Push the tests to branch "test/pr60-coverage".
```

**Agent 3 — CI/CD Monitor:**
```
Monitor the GitHub Actions workflow that runs on push to "test/pr60-coverage". 
When it completes, report the results back with pass/fail counts.
```

### 8.2 Using Planning Mode for GitHub Tasks

Switch to **Planning Mode** (`Cmd+E`) before complex GitHub operations:

```
I need to reorganize our test repository structure. Currently all 200+ test files 
are in a flat directory. Plan a migration that:
1. Organizes tests by feature (login, checkout, search, profile)
2. Creates a branch for the migration
3. Moves files to the correct directories  
4. Updates all import paths
5. Runs the full test suite to verify nothing breaks
6. Opens a PR with the changes

Create an Implementation Plan — don't execute yet.
```

The agent creates a detailed plan you can review before executing.

---

## Module 9: Troubleshooting GitHub MCP in Antigravity

### 9.1 Git Not Installed

**Symptom:** `git: command not found` when running `git --version`

**Fix for macOS:**
```bash
# Option 1: Xcode Command Line Tools (smallest, recommended)
xcode-select --install

# Option 2: Homebrew
brew install git
```

**Fix for Windows:**
```
# Download from https://git-scm.com/download/win
# Run the installer
# IMPORTANT: Select "Git from the command line and also from 3rd-party software"
# Restart Antigravity after installation
```

**Fix for Ubuntu/Debian Linux:**
```bash
sudo apt update
sudo apt install git -y
```

**Fix for Fedora/RHEL Linux:**
```bash
sudo dnf install git -y
```

**Verify after installation:**
```bash
git --version
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 9.2 GitHub MCP Not Showing Up

**Symptom:** No "github" in MCP Servers panel after adding config.

**Fixes:**
1. **Close and fully reopen Antigravity** (not just reload — quit and relaunch)
2. **Check JSON syntax** — a missing comma or bracket breaks everything:
   ```bash
   # Validate your JSON
   cat ~/.gemini/antigravity/mcp_config.json | python3 -m json.tool
   ```
3. **Verify you used `serverUrl`** not `url` — Antigravity requires `serverUrl` for HTTP servers
4. **Check token validity** — go to [github.com/settings/tokens](https://github.com/settings/tokens) and verify your token hasn't expired

### 9.3 Docker Errors (Method 2)

**Symptom:** `docker: command not found` or container fails to start.

**Fixes:**
1. Install Docker Desktop: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. **Ensure Docker is running** — look for the Docker whale icon in your system tray
3. If you get `permission denied`:
   ```bash
   # Linux only
   sudo usermod -aG docker $USER
   # Then logout and login again
   ```
4. If the image fails to pull:
   ```bash
   docker logout ghcr.io
   docker pull ghcr.io/github/github-mcp-server
   ```

### 9.4 "Unauthorized" or "Bad Credentials"

**Symptom:** Agent says it cannot authenticate with GitHub.

**Fixes:**
1. **Regenerate your PAT** — tokens expire, and the old one may be revoked
2. **Check token permissions** — ensure Issues, Pull Requests, Contents, and Metadata are enabled
3. **Check for extra spaces** — the token in mcp_config.json should have no leading/trailing spaces
4. **Bearer prefix** — ensure your Authorization header reads `"Bearer ghp_xxxxx..."` (with "Bearer " prefix and a space)

### 9.5 "Too Many Tools" Warning

**Symptom:** Antigravity warns about too many tools or agent behaves inconsistently.

**Fix:** Limit toolsets to only what you need:
```json
"X-MCP-Toolsets": "repos,issues,pull_requests,actions"
```
Keep total enabled tools under 50 for optimal performance.

### 9.6 Node.js Not Installed (For npx Method)

**Symptom:** `npx: command not found`

**Fix:**
```bash
# macOS
brew install node

# Windows — download from https://nodejs.org (LTS version)

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

### 9.7 MCP Config File Location

If you can't find the config file:

| OS | Config Path |
|----|-------------|
| macOS | `~/.gemini/antigravity/mcp_config.json` |
| Windows | `C:\Users\<USERNAME>\.gemini\antigravity\mcp_config.json` |
| Linux | `~/.gemini/antigravity/mcp_config.json` |

If the file doesn't exist, create it manually with valid JSON (`{}`).

---

---

# PART B: VS Code with GitHub Copilot

---

## Module 10: What is GitHub Copilot and Why QA Engineers Need It

### 10.1 What is GitHub Copilot?

GitHub Copilot is an AI-powered coding assistant built into VS Code. It provides inline code suggestions, a chat interface for asking questions, and an autonomous Agent Mode that can plan, write, run, and fix code across multiple files.

As of early 2026, Copilot has 4.7+ million paid users. It supports three modes: **Ask** (Q&A), **Edit** (targeted changes), and **Agent** (autonomous multi-step execution).

### 10.2 Why QA Engineers Need Copilot

- **Inline Suggestions**: Start typing a test method → Copilot suggests the entire test body with assertions
- **Chat**: Ask "How do I test this API endpoint?" → get a complete test with setup, execution, and validation
- **Agent Mode**: Say "Write E2E tests for the checkout flow" → Copilot creates files, installs dependencies, runs tests, fixes failures — all autonomously
- **Slash Commands**: `/tests` generates tests for selected code, `/fix` fixes a failing test, `/explain` explains complex test logic
- **Custom Instructions**: Define your QA standards once → every generated test follows your conventions automatically

### 10.3 Copilot Plans

| Plan | Price | What You Get |
|------|-------|-------------|
| **Copilot Free** | $0/month | Limited monthly inline suggestions and chat interactions |
| **Copilot Pro** | $10/month | Unlimited suggestions, chat, agent mode, model selection |
| **Copilot Pro+** | $39/month | Everything in Pro + Copilot coding agent (background tasks on GitHub) |
| **Copilot Business** | $19/user/month | Team features, admin controls, IP indemnity |
| **Copilot Enterprise** | $39/user/month | Organization-wide knowledge base, fine-tuning |

> The Free plan is enough to follow this tutorial. You get a monthly limit of inline suggestions and chat interactions.

---

## Module 11: Prerequisites & Installation in VS Code

### 11.1 What You Need

| Requirement | Details |
|-------------|---------|
| VS Code | Version 1.99 or later. Download from [code.visualstudio.com](https://code.visualstudio.com) |
| GitHub Account | Any plan (Free, Pro, Team, Enterprise) |
| Git Installed | Required for source control integration |

### 11.2 Installing GitHub Copilot Extension

**Step 1:** Open VS Code.

**Step 2:** Open Extensions panel: `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS).

**Step 3:** Search for **"GitHub Copilot"** — find the official extension by GitHub.

**Step 4:** Click **Install**. This single extension includes both code suggestions and chat functionality.

**Step 5:** After installation, you'll see a Copilot icon in the Status Bar (bottom-right).

### 11.3 Sign In to GitHub

**Step 1:** Hover over the Copilot icon in the Status Bar → Click **"Use AI Features"**.

**Step 2:** Choose your sign-in method and follow the prompts.

**Step 3:** If you don't have a Copilot subscription, you'll be enrolled in the **Copilot Free** plan automatically.

**Verify:** The Copilot icon should show as active (no warning symbols).

### 11.4 First Test — Type and See

**Step 1:** Create a new file called `LoginTest.java`.

**Step 2:** Start typing:
```java
// Test that user can login with valid credentials
@Test
public void testValidLogin
```

**Step 3:** Copilot should suggest the rest of the method in gray text ("ghost text").

**Step 4:** Press `Tab` to accept the suggestion.

If you see suggestions, Copilot is working.

### 11.5 Configure for Agent Mode

Open your VS Code settings (`Ctrl+,`) and ensure these are enabled:

```json
{
  "chat.agent.enabled": true,
  "github.copilot.chat.agent.runTasks": true,
  "github.copilot.chat.agent.autoFix": true
}
```

---

## Module 12: Copilot Modes — Ask, Edit, and Agent Mode Explained

### 12.1 Three Modes Overview

| Mode | Best For | How It Works |
|------|----------|-------------|
| **Ask** | Questions, explanations, debugging help | Read-only. Copilot answers questions about your code but doesn't modify files. |
| **Edit** | Targeted changes to specific files | Copilot suggests edits in place. You review and accept/reject each change. Good for refactoring or fixing specific code. |
| **Agent** | Multi-step autonomous tasks | Copilot plans, writes code, creates files, runs terminal commands, monitors test results, and self-corrects. Most powerful mode for QA. |

### 12.2 How to Switch Modes

Open the Chat view (`Ctrl+Alt+I` on Windows/Linux, `Ctrl+Cmd+I` on macOS).

At the top of the chat panel, you'll see a **mode dropdown**. Click it to switch between Ask, Edit, and Agent.

### 12.3 When to Use Each Mode for QA

**Use Ask Mode when:**
```
# Explain what this test does
What does this Playwright test check? Is it testing the correct behavior?

# Debug a failure
My LoginTest.testInvalidCredentials is failing with NoSuchElementException. 
The error points to line 45. What could be wrong?

# Get guidance
What's the best approach for testing an API endpoint that requires OAuth2 authentication?
```

**Use Edit Mode when:**
```
# Fix a specific test
Fix the assertion on line 32 — it should check for HTTP 201, not 200

# Refactor a single file
Refactor this test class to use Page Object Model pattern

# Add missing waits
Replace all Thread.sleep() calls in this file with explicit WebDriverWait
```

**Use Agent Mode when:**
```
# Generate a complete test suite
Create Playwright E2E tests for the user registration flow covering: 
valid registration, duplicate email, weak password, missing required fields.
Use POM pattern. Run the tests after creation and fix any failures.

# Set up a framework from scratch
Set up a Selenium Java project with Maven, TestNG, POM pattern, ExtentReports, 
and a sample login test that runs against https://practice.sdetunicorns.com
```

---

## Module 13: Keyboard Shortcuts & Slash Commands for QA

### 13.1 Essential Keyboard Shortcuts

| Shortcut (macOS) | Shortcut (Windows/Linux) | Action | QA Use |
|-------------------|--------------------------|--------|--------|
| `Tab` | `Tab` | Accept inline suggestion | Accept generated test code |
| `Esc` | `Esc` | Dismiss suggestion | Reject bad suggestion |
| `Alt+]` | `Alt+]` | Show next suggestion | Cycle to better test variant |
| `Alt+[` | `Alt+[` | Show previous suggestion | Go back to previous variant |
| `Cmd+Right` | `Ctrl+Right` | Accept word-by-word | Accept suggestion one word at a time for review |
| `Cmd+I` | `Ctrl+I` | Open inline chat | Ask Copilot about selected code without leaving the editor |
| `Ctrl+Cmd+I` | `Ctrl+Alt+I` | Open Chat view | Open full chat panel |
| `Cmd+N` | `Ctrl+N` | New chat session | Start fresh conversation |
| `Shift+Cmd+I` | `Ctrl+Shift+Alt+I` | Switch to Agent mode | Toggle agent mode in chat |

### 13.2 Slash Commands

Type `/` followed by the command name in the chat. These are shortcuts for common QA tasks.

| Slash Command | What It Does | QA Prompt Example |
|---------------|-------------|-------------------|
| `/tests` | Generate tests for selected code | Select a method → `/tests Generate TestNG tests with @DataProvider for this method` |
| `/fix` | Fix a problem in code | Select failing test → `/fix The assertion is comparing wrong field names` |
| `/explain` | Explain how code works | Select complex test → `/explain What scenarios does this test cover?` |
| `/doc` | Generate documentation | Select a test class → `/doc Add Javadoc describing each test scenario` |
| `/init` | Set up project for AI | `/init` — Analyzes your codebase and creates custom instructions |
| `/clear` | Clear chat history | `/clear` — Start fresh when context gets confused |

### 13.3 Practical Slash Command Examples for QA

**Generate Tests:**
```
/tests Generate Playwright tests for this component using AAA pattern (Arrange-Act-Assert). 
Include happy path, edge cases, and error scenarios.
```

**Fix Failing Test:**
```
/fix This test fails with TimeoutError because the element is inside a shadow DOM. 
Fix it to handle shadow DOM correctly.
```

**Explain Complex Logic:**
```
/explain Why does this test use a retry mechanism? What race conditions is it handling?
```

---

## Module 14: Context References — #file, @workspace, @terminal

### 14.1 Context Types

Context references let you point Copilot at specific information for more accurate responses.

| Reference | What It Does | Example |
|-----------|-------------|---------|
| `#file` | Reference a specific file | `#file:LoginPage.java How do I improve the locators in this page object?` |
| `#selection` | Reference selected code | Select code → `Fix the assertion in #selection` |
| `@workspace` | Reference your entire workspace | `@workspace Where are all the tests that cover the checkout flow?` |
| `@terminal` | Reference terminal output | `@terminal Explain why this test failed based on the terminal output` |
| `@vscode` | Reference VS Code features | `@vscode How do I configure the test explorer for Playwright?` |

### 14.2 Practical Examples for QA

**Multi-file context:**
```
Look at #file:LoginPage.java and #file:LoginTest.java. 
The test is failing because the page object has outdated locators. 
Update the locators in LoginPage.java to match the current HTML structure 
described in #file:login.html
```

**Workspace-wide search:**
```
@workspace Find all test files that don't have any @BeforeMethod or @BeforeEach setup. 
These tests might have initialization issues.
```

**Terminal-based debugging:**
```
@terminal The Playwright tests just failed. Look at the error output and tell me:
1. Which tests failed
2. What the root cause is for each failure
3. Whether it's a test bug or an app bug
```

---

## Module 15: Custom Instructions — copilot-instructions.md for QA

### 15.1 What Are Custom Instructions?

Custom instructions tell Copilot about your project's standards and conventions. Every time Copilot generates code, it follows these rules — so you don't have to correct it every time.

### 15.2 Create Your QA Instructions File

Create the file at: `.github/copilot-instructions.md` in your project root.

```markdown
# QA Automation Standards

## Test Framework
- Java 17 + Selenium 4 + TestNG for UI tests
- TypeScript + Playwright for E2E tests
- REST Assured for API tests
- Allure for reporting

## Coding Conventions
- ALWAYS use Page Object Model (POM) for UI tests
- NEVER use Thread.sleep() — use explicit WebDriverWait only
- NEVER hardcode test data — use @DataProvider or fixtures
- Every test MUST have at least one meaningful assertion
- Test method naming: test_{feature}_{scenario}_{expectedResult}
- Page Object naming: {PageName}Page.java or {pageName}.page.ts

## Test Structure
- Arrange (setup) → Act (execute) → Assert (verify) pattern
- @BeforeMethod for setup, @AfterMethod for teardown
- Screenshot on every failure (configured in TestBase)
- Maximum 10 lines per test method — extract helpers for longer tests

## Locator Strategy (Priority Order)
1. data-testid attributes (preferred)
2. aria-label / role
3. ID
4. CSS selectors
5. XPath (last resort only)

## Validation Commands
- Build: mvn clean compile
- Run all: mvn test
- Run smoke: mvn test -DsuiteXmlFile=smoke-testng.xml
- Run Playwright: npx playwright test
- Run API tests: mvn test -pl api-tests
```

### 15.3 Language-Specific Instructions

You can also create language-specific instruction files:

`.github/copilot-instructions/java.md`:
```markdown
- Use Java 17 features (records, pattern matching, text blocks)
- Use var for local variables with obvious types
- Use Lombok @Data for page object fields
```

`.github/copilot-instructions/typescript.md`:
```markdown
- Use strict TypeScript with no any types
- Use Playwright fixtures for shared state
- Use test.describe() for grouping related tests
```

### 15.4 Verify Instructions Are Working

After creating the file, open Copilot Chat and type:
```
/init
```

Then ask:
```
What QA conventions should you follow when generating tests for this project?
```

Copilot should reference your custom instructions in its response.

---

## Module 16: Agent Mode — Autonomous Multi-File Test Generation

### 16.1 What Makes Agent Mode Special

Agent Mode is the most powerful feature for QA Engineers. Unlike Ask or Edit mode, Agent Mode can:

- **Determine context autonomously** — it reads your project files without being told which ones
- **Create and edit multiple files** — generates page objects, test classes, configs, and helpers
- **Run terminal commands** — executes `mvn test`, `npx playwright test`, `npm install`, etc.
- **Self-correct** — if tests fail, it reads the error, fixes the code, and reruns automatically
- **Install dependencies** — runs `npm install` or adds Maven dependencies as needed

### 16.2 How to Use Agent Mode

**Step 1:** Open Chat view: `Ctrl+Alt+I` (Windows/Linux) or `Ctrl+Cmd+I` (macOS).

**Step 2:** Select **"Agent"** from the mode dropdown at the top of the chat panel.

**Step 3:** Type your prompt and let the agent work.

### 16.3 QA Prompt Templates for Agent Mode

**Complete Framework Setup:**
```
Set up a Selenium Java test automation project with:
- Maven pom.xml with Selenium 4, TestNG, WebDriverManager, ExtentReports
- TestBase class with Chrome setup, WebDriverWait, screenshot on failure
- LoginPage with POM pattern (username, password, submit, error message locators)
- LoginTest with 3 test cases: valid login, invalid password, empty fields
- testng.xml with smoke suite
- Run all tests and fix any failures
```

**Playwright E2E Suite:**
```
Create a Playwright TypeScript test suite for a shopping cart feature:
1. Add item to cart → verify cart count updates
2. Remove item from cart → verify cart is empty
3. Update quantity → verify price recalculates
4. Apply coupon code → verify discount
5. Proceed to checkout → verify all items present

Use POM pattern with CartPage and CheckoutPage. 
Configure for Chrome, Firefox, and mobile Chrome.
Run all tests and fix any failures.
```

**API Test Generation:**
```
I have this OpenAPI spec at @file:openapi.yaml. 
Generate REST Assured tests for every endpoint covering:
- Happy path (200/201 responses)
- Validation errors (400 responses)  
- Unauthorized access (401 responses)
- Not found (404 responses)
- Schema validation for every response body

Run them and show me the results.
```

**Fix Flaky Tests:**
```
@workspace Find all tests that have failed intermittently in the last CI run.
For each flaky test:
1. Identify the root cause (timing issue, data dependency, resource contention)
2. Fix the issue (add proper waits, use unique test data, add retry logic)
3. Run the fixed tests 3 times to verify stability
```

### 16.4 Agent Mode Tips

- **Be specific about frameworks** — "Selenium 4 with TestNG" not just "write tests"
- **Include validation** — always add "run the tests and fix failures" to your prompt
- **Reference files** — use `#file:config.ts` to point at existing configurations
- **Start small** — one feature at a time, not "test the entire app"
- **Review terminal output** — Agent shows what commands it runs; verify they make sense
- **Agent mode uses more tokens** — for simple tasks, stick to Edit mode

---

## Module 17: Copilot Skills & Custom Agents for QA

### 17.1 What Are Copilot Skills?

Skills are folders containing a `SKILL.md` file with specialized instructions, scripts, and resources. When you ask Copilot something that matches a skill's description, it loads those instructions automatically.

### 17.2 Create a QA Testing Skill

Create a folder: `.github/skills/qa-testing/SKILL.md`

```markdown
---
name: qa-testing
description: Guide for creating test automation code. Use when asked to write tests, 
  create page objects, set up test frameworks, or generate test data.
---

# QA Test Automation Skill

## When to use this skill
- Creating new test files (unit, integration, E2E)
- Setting up test automation frameworks
- Generating page objects or test utilities
- Creating test data factories

## Test Creation Rules
1. Every test follows AAA pattern (Arrange → Act → Assert)
2. One logical assertion per test method
3. Descriptive test names: test_{feature}_{scenario}_{expected}
4. No test interdependencies — each test runs independently
5. Clean up test data in @AfterMethod / afterEach

## Framework Templates

### Selenium + TestNG Test
Use Page Object Model. Include WebDriverWait. 
Use @DataProvider for parameterized tests.
Screenshot on failure configured in TestBase.

### Playwright Test  
Use POM with TypeScript classes.
Use test.describe() for grouping.
Use expect() for assertions.
Configure retries: 2 for CI, 0 for local.
```

### 17.3 Create a Custom QA Reviewer Agent

Create a file: `.github/agents/qa-reviewer.md`

```markdown
---
name: 'QA Reviewer'
description: 'Review test code for quality, coverage, and adherence to QA best practices.'
tools: ['read', 'search', 'agent']
---

# QA Code Reviewer Agent

You are an experienced Senior SDET reviewing test automation code.

## Review Checklist
- [ ] Tests follow Page Object Model
- [ ] No hardcoded test data
- [ ] No Thread.sleep() or arbitrary waits
- [ ] Meaningful assertions (not just "page loaded")
- [ ] Proper setup and teardown
- [ ] Screenshot on failure configured
- [ ] Test names describe the scenario
- [ ] No test interdependencies
- [ ] Edge cases covered (empty, null, boundary values)
- [ ] Error scenarios tested (timeout, invalid input, unauthorized)

## Important Guidelines
- Focus on explaining what should be changed and why
- Provide specific examples from the code being reviewed
- DO NOT make code changes — analysis only
```

### 17.4 Invoke Skills and Agents

**Invoke the QA testing skill:**
```
/qa-testing Create E2E tests for the user profile page
```

**Invoke the QA reviewer agent:**
```
@qa-reviewer Review the tests in src/test/java/tests/CheckoutTest.java
```

---

## Module 18: Troubleshooting Copilot in VS Code

### 18.1 Copilot Not Showing Suggestions

**Symptom:** No gray "ghost text" appears as you type.

**Fixes:**
1. **Check Copilot status** — look at the Status Bar icon. If it shows a warning, click it for details.
2. **Verify sign-in** — `Ctrl+Shift+P` → type `GitHub Copilot: Sign In`
3. **Check language is enabled** — Copilot can be disabled for specific languages. Go to Settings → search "copilot" → ensure your language isn't in the disabled list.
4. **Check monthly limit** — Free plan users may have exhausted their monthly quota.
5. **Restart VS Code** — sometimes a simple restart fixes connection issues.

### 18.2 Agent Mode Not Available

**Symptom:** No "Agent" option in the mode dropdown.

**Fixes:**
1. **Update VS Code** — Agent mode requires VS Code 1.99+. Check: `Help > About`.
2. **Enable the setting**:
   ```json
   { "chat.agent.enabled": true }
   ```
3. **Switch to Pre-Release extension** — Go to Extensions → GitHub Copilot → click "Switch to Pre-Release Version" → restart.
4. **Check subscription** — Agent mode features may require Copilot Pro.

### 18.3 "Copilot could not connect to server"

**Symptom:** Network error in Copilot chat.

**Fixes:**
1. **Check internet connection** — Copilot requires internet access
2. **Check proxy/firewall** — ensure `*.github.com` and `*.githubcopilot.com` are not blocked
3. **Sign out and sign back in**:
   - Click the Accounts icon in the Activity Bar (left sidebar)
   - Select "Sign out"
   - Sign in again with your GitHub credentials
4. **Check VPN** — some VPNs block Copilot. Try disconnecting.

### 18.4 Git Not Installed (Affects Source Control Features)

**Symptom:** Copilot can't generate commit messages or reference Git history.

**Follow the same Git installation steps from Module 9.1** (Part A).

After installing Git, restart VS Code and verify:
```bash
git --version
```

### 18.5 Copilot Generates Wrong Framework/Language

**Symptom:** You want Selenium Java, but Copilot generates Playwright TypeScript.

**Fixes:**
1. **Create copilot-instructions.md** (Module 15) — explicitly state your framework preferences
2. **Be explicit in prompts** — "Using Selenium 4 with Java 17 and TestNG, write..."
3. **Open relevant files** — Copilot uses your open tabs as context. Open your pom.xml or existing test files.
4. **Use #file references** — `#file:pom.xml I want tests compatible with this project`

### 18.6 Agent Mode Goes Off Track

**Symptom:** Agent keeps running commands that don't make sense or installs wrong dependencies.

**Fixes:**
1. **Be more specific** — vague prompts lead to wrong assumptions
2. **Provide context** — reference your config files: `#file:playwright.config.ts`
3. **Intervene early** — if the agent starts going wrong, hit Escape and redirect
4. **Use the Undo button** — "Undo Last Edit" in the Chat view title bar reverts the last change
5. **Start a new session** — `Cmd+N` / `Ctrl+N` to start fresh if context is too confused

### 18.7 Slow Suggestions or Timeouts

**Fixes:**
1. **Close unnecessary tabs** — too many open files slow down Copilot context
2. **Reduce workspace size** — add large folders (node_modules, target, build) to `.gitignore`
3. **Switch models** — in Chat, use the model dropdown to try a faster model
4. **Check system resources** — close other heavy applications

---

---

## Quick Reference — Top 20 Prompts

### GitHub + Antigravity (Top 10)

| # | Prompt |
|---|--------|
| 1 | `Create a GitHub issue for the bug I just found: [describe bug]. Label it as "bug" and "priority-high".` |
| 2 | `Create a branch called "test/[feature-name]" from main and push my new test files to it.` |
| 3 | `Open a PR from "test/[feature-name]" to "main" with a description of all new test cases.` |
| 4 | `Review PR #[number] for QA anti-patterns: missing assertions, hardcoded data, Thread.sleep().` |
| 5 | `Show me the last 5 CI/CD workflow runs. Are any failing? What's the error?` |
| 6 | `Search all repos in our org for tests using Thread.sleep() — list each file and line.` |
| 7 | `List all open issues labeled "flaky-test" and suggest fixes based on the error descriptions.` |
| 8 | `Read the test config file from our repo and suggest improvements for parallel execution.` |
| 9 | `Close issue #[number] with comment "Verified fixed in regression run [date]."` |
| 10 | `Create GitHub Actions workflow for running our Playwright tests on every PR to main.` |

### VS Code + Copilot (Top 10)

| # | Prompt |
|---|--------|
| 1 | `/tests Generate TestNG tests with @DataProvider for [selected method]` |
| 2 | `/fix This test fails with TimeoutError. The element is loaded dynamically via AJAX.` |
| 3 | `/explain What edge cases does this test cover? What's missing?` |
| 4 | `In Agent mode: Set up a complete Selenium Java framework with POM, TestNG, ExtentReports.` |
| 5 | `In Agent mode: Write Playwright E2E tests for [feature]. Run them and fix failures.` |
| 6 | `@workspace Find all tests without assertions and add meaningful assertions to each.` |
| 7 | `#file:LoginPage.java Update all locators to use data-testid attributes.` |
| 8 | `@terminal The tests just failed. Diagnose the root cause from the terminal output.` |
| 9 | `In Agent mode: Convert all 15 Selenium tests in this folder to Playwright TypeScript.` |
| 10 | `Create a .github/copilot-instructions.md with our team's QA standards.` |

---

## Summary — What We Covered

| Part | Topic | Key Takeaway |
|------|-------|-------------|
| A-Module 1 | Why GitHub MCP | AI agent talks to GitHub directly — no context switching |
| A-Module 2 | Prerequisites | Antigravity + GitHub account + Git installed |
| A-Module 3 | MCP Installation | 3 methods: Remote (recommended), Docker, npx |
| A-Module 4 | GitHub PAT | Fine-grained token with Issues, PRs, Contents, Actions permissions |
| A-Module 5 | Verification | Test with "List my repos" → verify tools are available |
| A-Module 6 | Tool Reference | 50+ tools across 6 toolsets: repos, issues, PRs, search, actions, security |
| A-Module 7 | Real Workflows | Bug→Issue, Tests→PR, CI/CD monitoring, code review |
| A-Module 8 | Multi-Agent | Agent Manager for parallel QA blitz workflows |
| A-Module 9 | Troubleshooting | Git install, Docker errors, auth issues, config fixes |
| B-Module 10 | Why Copilot | Inline suggestions + Chat + Agent mode for test generation |
| B-Module 11 | Installation | One extension, sign in, enable agent mode settings |
| B-Module 12 | Three Modes | Ask (Q&A), Edit (targeted), Agent (autonomous) |
| B-Module 13 | Shortcuts | Tab, /tests, /fix, /explain, /doc — muscle memory for QA |
| B-Module 14 | Context | #file, @workspace, @terminal for precise AI responses |
| B-Module 15 | Instructions | copilot-instructions.md enforces QA standards automatically |
| B-Module 16 | Agent Mode | Autonomous framework setup, test generation, self-correction |
| B-Module 17 | Skills & Agents | Reusable QA testing skill + custom QA reviewer agent |
| B-Module 18 | Troubleshooting | No suggestions, agent issues, auth, performance fixes |

---

**Created by: Pramod Dutta**
Founder — [TheTestingAcademy.com](https://thetestingacademy.com) | YouTube 150K+ Subscribers | Instagram 100K+ Followers
LinkedIn — [linkedin.com/in/pramoddutta](https://www.linkedin.com/in/pramoddutta/)

---
