# Findings

## Research
- The user provided a wireframe showing a dual-view setup:
  1. A chat/generation interface with a History sidebar.
  2. A configuration interface with settings for various LLM APIs (Ollama, Groq, OpenAI), a Save button, and a Test Connection button.

## Discoveries
- **Use Case:** Generating API and Web App test cases (Functional and Non-Functional).
- **Format Requirements:** The generated test cases must strictly be in a Jira format.
- **Input Method:** Users will copy-paste Jira requirements into a chat interface.
- **Tech Stack:** Node.js (Backend), React (Frontend), all in TypeScript.
- **LLM Integrations:** The app must support a wide range of APIs: Ollama, LM Studio, Groq, OpenAI, Claude, and Gemini.

## Constraints
- Must use a local LLM or specified external APIs.
- Must follow Protocol 0.
- Must output in Jira format.
