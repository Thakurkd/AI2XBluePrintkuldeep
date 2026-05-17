# Task Plan & Blueprint

## Phase 1: Discovery & Blueprinting (Complete)
- [x] Gather requirements.
- [x] Review design wireframes.
- [x] Formulate Blueprint.

## Phase 2: Implementation (Pending)
- [ ] Initialize Node.js + TypeScript backend.
- [ ] Initialize React + TypeScript frontend.
- [ ] Build Frontend UI:
  - Main Chat/Generation interface (History sidebar, Chat area, Input field).
  - Settings Interface (Ollama, LM Studio, Groq, OpenAI, Claude, Gemini configs, Save, Test Connection).
- [ ] Build Backend APIs:
  - LLM integration layer (Ollama, LM Studio, Groq, OpenAI, Claude, Gemini).
  - Logic to format outputs into Jira format for functional/non-functional API/Web test cases.
- [ ] Connect Frontend to Backend.

## Phase 3: Testing & Refinement (Pending)
- [ ] Test connections to all supported LLMs.
- [ ] Verify test case generation formats (Jira style).
- [ ] Refine UI/UX based on design.

## Blueprint Overview
**Objective:** Generate functional and non-functional API and Web App test cases in Jira format.
**Stack:** React (Frontend), Node.js (Backend), TypeScript.
**Input:** User provides Jira requirements via chat input.
**LLMs Supported:** Ollama, LM Studio, Groq, OpenAI, Claude, Gemini.
**Design Reference:** Includes Chat View (History, Output, Input) and Settings View (API keys/configs, Save, Test Connection).
