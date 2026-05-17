# 🤖 Project 01 — Local LLM Test Case Generator

> A full-stack application that leverages local Large Language Models (LLMs) to automatically generate functional and non-functional test cases in Jira markup format.

---

## 📋 Overview

This project provides an end-to-end solution for generating test cases using locally hosted LLMs. It features a React frontend for inputting requirements and configuring LLM providers, and a Node.js backend that interfaces with multiple LLM services.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js / Express |
| LLM Providers | Ollama, LM Studio, Groq, OpenAI, Claude, Gemini |
| Design | Figma / Custom UI |

## 📂 Project Structure

```
Project_01_LocalLLM_TestCaseGenerator/
├── backend/          ← Node.js API server
├── frontend/         ← React UI application
├── Design/           ← UI/UX design assets
├── context.md        ← Project context notes
├── findings.md       ← Research findings
├── progress.md       ← Development progress log
└── task_plan.md      ← Task breakdown & planning
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Ollama (for local LLM support)

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 Features

- ✅ Multi-provider LLM support (Ollama, LM Studio, Groq, OpenAI, Claude, Gemini)
- ✅ Connection testing for each provider
- ✅ Test case generation in Jira markup format
- ✅ Functional & non-functional test case output
- ✅ Modern, responsive UI

---

> **This is an independent project.** It is NOT related to Project 02.
