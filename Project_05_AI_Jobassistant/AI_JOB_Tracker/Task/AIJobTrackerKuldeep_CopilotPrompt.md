# AIJobTrackerKuldeep — GitHub Copilot Master Prompt

---

## 🚀 Project Overview

Build a full-stack AI-powered Job Tracker web application called **AIJobTrackerKuldeep**.

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI Integration:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Auth:** JWT + bcrypt
- **State Management:** Zustand
- **HTTP Client:** Axios

---

## 📁 Project Structure

```
AIJobTrackerKuldeep/
├── client/                        # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── board/
│   │   │   │   ├── KanbanBoard.jsx
│   │   │   │   ├── KanbanColumn.jsx
│   │   │   │   └── JobCard.jsx
│   │   │   ├── jobs/
│   │   │   │   ├── AddJobModal.jsx
│   │   │   │   ├── JobDetailModal.jsx
│   │   │   │   └── JobForm.jsx
│   │   │   ├── ai/
│   │   │   │   ├── AIAssistant.jsx
│   │   │   │   ├── ResumeAnalyzer.jsx
│   │   │   │   └── AIInsightsPanel.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsOverview.jsx
│   │   │   │   ├── ApplicationChart.jsx
│   │   │   │   └── CompanyList.jsx
│   │   │   └── auth/
│   │   │       ├── Login.jsx
│   │   │       └── Register.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Board.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Resumes.jsx
│   │   │   ├── Interviews.jsx
│   │   │   └── AuthPage.jsx
│   │   ├── store/
│   │   │   ├── useJobStore.js
│   │   │   ├── useAuthStore.js
│   │   │   └── useAIStore.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── jobService.js
│   │   │   └── aiService.js
│   │   ├── hooks/
│   │   │   ├── useDragDrop.js
│   │   │   └── useAIInsights.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                        # Node.js + Express Backend
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── env.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Resume.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── job.routes.js
│   │   ├── ai.routes.js
│   │   └── resume.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── job.controller.js
│   │   ├── ai.controller.js
│   │   └── resume.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── services/
│   │   └── claude.service.js      # Anthropic Claude API integration
│   ├── app.js
│   └── package.json
│
├── .env.example
├── README.md
└── package.json                   # Root scripts (concurrently)
```

---

## 🎨 UI Design Requirements

Design a **dark-themed, modern glassmorphism UI** with:

- **Color palette:**
  - Background: `#0a0f1e` (deep navy)
  - Card background: `rgba(255,255,255,0.05)` with `backdrop-filter: blur(12px)`
  - Primary accent: `#6366f1` (indigo)
  - Success green: `#10b981`
  - Warning orange: `#f59e0b`
  - Danger red: `#ef4444`
  - Text primary: `#f1f5f9`
  - Text muted: `#94a3b8`

- **Font:** `'Outfit'` (headings) + `'DM Sans'` (body) from Google Fonts

- **Kanban columns** (left to right):
  1. 🔖 Wishlist
  2. 📤 Applied
  3. 🔍 Screening
  4. 🎯 Interviews
  5. 💼 Offer
  6. ❌ Closed

- **Animations:** Framer Motion drag-and-drop between columns, card hover lift effects, modal slide-in transitions

---

## 🔧 Core Features to Build

### 1. Authentication
```
- User Registration (name, email, password)
- User Login with JWT
- Protected routes
- Persistent session via localStorage token
```

### 2. Job Management (Full CRUD)
```
Job model fields:
  - title (String, required)
  - company (String, required)
  - location (String) — "Remote", "NYC", "SF", etc.
  - salary (String) — e.g., "$180k"
  - status (Enum): wishlist | applied | screening | interviews | offer | closed
  - tags (Array of Strings) — e.g., ["React", "Node.js"]
  - notes (String)
  - appliedDate (Date)
  - deadline (Date)
  - jobUrl (String)
  - isUrgent (Boolean)
  - aiMatchScore (Number, 0-100)
  - createdAt (auto)
  - updatedAt (auto)
```

### 3. Kanban Board
```
- Drag and drop job cards between columns
- Each column shows job count badge
- Job cards display: company, title, location, tags, salary, days ago, AI match score
- Color-coded left border per status
- "+ Add card" button in each column
- Urgent badge on cards
```

### 4. Dashboard Overview
```
Stats cards:
  - Total Applied (with "X this week" subtitle)
  - Interviews scheduled
  - Offers received
  - Avg AI Match % (with trend arrow)

Company breakdown list (left sidebar):
  - Group jobs by company with count

AI Insights panel:
  - Shows top insight from Claude (resume match, suggestions)
  - "Run full analysis →" link
```

### 5. AI Features (Claude API Integration)
```
POST /api/ai/analyze-resume
  - Accept resume text
  - Return: match score, missing skills, suggestions, top matching jobs

POST /api/ai/generate-cover-letter
  - Input: job details + user profile
  - Return: personalized cover letter text

POST /api/ai/chat
  - General job-hunting AI assistant chat
  - Context-aware (knows user's current applications)

POST /api/ai/interview-prep
  - Input: job title + company
  - Return: 10 likely interview questions with ideal answers
```

### 6. Analytics Page
```
- Applications over time (line chart using Recharts)
- Status distribution (donut chart)
- Response rate %
- Average time per stage
```

### 7. Resume Manager
```
- Upload and store multiple resume versions
- AI score each resume against saved jobs
- Suggest improvements per job
```

### 8. Interview Tracker
```
- List upcoming scheduled interviews
- Show company, role, date/time, interview type (phone/video/onsite)
- AI-generated prep questions per interview
```

---

## 🔌 API Endpoints

### Auth Routes
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Job Routes
```
GET    /api/jobs              — Get all jobs for logged-in user
POST   /api/jobs              — Create new job
GET    /api/jobs/:id          — Get single job
PUT    /api/jobs/:id          — Update job (including status change)
DELETE /api/jobs/:id          — Delete job
PATCH  /api/jobs/:id/status   — Move job between Kanban columns
```

### AI Routes
```
POST   /api/ai/analyze-resume
POST   /api/ai/cover-letter
POST   /api/ai/chat
POST   /api/ai/interview-prep
GET    /api/ai/insights        — Get cached AI insights for dashboard
```

### Resume Routes
```
POST   /api/resumes            — Upload resume
GET    /api/resumes            — List user's resumes
DELETE /api/resumes/:id
```

---

## 🤖 Claude Service (server/services/claude.service.js)

```javascript
// Use Anthropic SDK
// npm install @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeResume(resumeText, jobDescriptions) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Analyze this resume against these job descriptions and return a JSON with:
      { matchScore: number, missingSkills: string[], suggestions: string[], topRoles: string[] }
      
      Resume: ${resumeText}
      Jobs: ${jobDescriptions}`
    }]
  });
  return JSON.parse(response.content[0].text);
}

export async function generateCoverLetter(jobTitle, company, userProfile) { ... }
export async function chatAssistant(messages, userContext) { ... }
export async function generateInterviewPrep(jobTitle, company) { ... }
```

---

## 📦 Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aijobtracker
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Client
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📜 Root package.json Scripts

```json
{
  "name": "AIJobTrackerKuldeep",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && npm run dev",
    "client": "cd client && npm run dev",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install",
    "build": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

---

## 🛠️ Key Dependencies

### Client (client/package.json)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "framer-motion": "^11.0.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "lucide-react": "^0.383.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Server (server/package.json)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^8.3.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express-async-handler": "^1.2.0",
    "multer": "^1.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## 🎯 Copilot Instructions (paste this into GitHub Copilot Chat)

```
I am building a full-stack AI job tracker app called AIJobTrackerKuldeep.

Tech stack: React 18 + Vite + Tailwind CSS + Framer Motion (frontend), 
Node.js + Express.js + MongoDB + Mongoose (backend), 
Anthropic Claude API for AI features, JWT for auth.

Design: Dark glassmorphism UI, deep navy background (#0a0f1e), 
indigo accent (#6366f1), Outfit + DM Sans fonts.

Please scaffold the complete project with:
1. Express REST API with auth (JWT), job CRUD, and AI routes
2. React frontend with Kanban board (drag-and-drop via @dnd-kit), 
   dashboard stats, analytics charts (Recharts), and AI chat panel
3. Zustand stores for jobs, auth, and AI state
4. Claude API integration for resume analysis, cover letter generation, 
   interview prep, and AI assistant chat
5. All modals, forms, and animations with Framer Motion

Start with the project structure and server setup, then build 
the React components one by one.

Project name: AIJobTrackerKuldeep
```

---

## ✅ Quick Start Commands

```bash
# 1. Clone / create project
mkdir AIJobTrackerKuldeep && cd AIJobTrackerKuldeep

# 2. Install all dependencies
npm run install:all

# 3. Setup .env in /server (copy from .env.example)

# 4. Run both client + server
npm run dev

# Client runs on: http://localhost:5173
# Server runs on: http://localhost:5000
```

---

*Project by Kuldeep — AIJobTrackerKuldeep*
