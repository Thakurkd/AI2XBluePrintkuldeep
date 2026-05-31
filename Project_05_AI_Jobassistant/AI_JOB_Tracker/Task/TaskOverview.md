# Task Overview: AI Job Tracker

## Goal
Create a full‑stack AI‑powered job‑tracker web application that lets a user:
- Register / log in.
- Add, view, and manage job applications on a Kanban board.
- Use AI (local Ollama llama 3.2) for resume analysis, cover‑letter generation, interview‑prep, and an interactive AI assistant.

## How it was built
1. **Project scaffolding** – Vite + React for the client, Express + Mongoose for the server.
2. **Authentication** – JWT‑based login, password hashing with `bcryptjs`.
3. **Database** – MongoDB models for `User`, `Job`, `Resume`.
4. **AI Services**
   - Added `server/services/ollama.service.js` that talks to a local Ollama instance (`http://localhost:11434`) using the `llama3.2` model.
   - Updated `server/controllers/ai.controller.js` to try Ollama first, fall back to Claude API, then to a smart mock.
   - Added health‑check endpoint `ollamaHealthHandler`.
5. **Frontend UI** – Glass‑morphism layout, dark mode, animated components (Navbar, Sidebar, Kanban board, AI assistant panel).
6. **Routing** – Express routes for auth, jobs, resumes, and AI endpoints.
7. **Development scripts** – `npm run dev` runs client and server concurrently; `npm run build` builds the Vite client.

## How it works (simple flow)
- **Sign‑up / login** → JWT stored in localStorage.
- **Dashboard** shows stats (applications, offers, etc.) fetched from `/api/insights`.
- **Kanban board** (`/board`) lets you drag cards between columns (Applied, Interview, Offer, etc.).
- **AI Assistant** (`/ai`) sends the conversation history to `/api/chat`. The server first calls Ollama; if unavailable it uses Claude; finally returns a mock response.
- **Resume / Cover‑letter** – Upload a resume, the server analyses it against stored job descriptions via Claude/Ollama services.

## Demo credentials
- **URL:** `http://localhost:5173/login`
- **Email:** `test@example.com`
- **Password:** `Test1234!`

## Prompt reference
The original prompt that guided the implementation has been copied here:
- `PromptForTracker/AIJobTrackerKuldeep_CopilotPrompt.md`

You can find this file inside the **Task** folder.

---
*Generated automatically by Antigravity.*
