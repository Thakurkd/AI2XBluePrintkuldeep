# AIJobTrackerKuldeep

A full-stack AI-powered Job Tracker web application built with React, Node.js, Express, MongoDB, and Claude AI.

## 🚀 Features

- **Job Management**: Full CRUD operations for tracking job applications
- **Kanban Board**: Drag-and-drop interface with 6 status columns
- **AI Integration**: Claude API for resume analysis, cover letter generation, and interview prep
- **Dashboard**: Real-time stats and analytics
- **Authentication**: JWT-based user authentication
- **Resume Manager**: Upload and AI-score multiple resumes
- **Interview Tracker**: Manage scheduled interviews with AI-generated prep questions

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark glassmorphism UI)
- Framer Motion (animations)
- Zustand (state management)
- Axios (HTTP client)

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Anthropic Claude API
- JWT + bcrypt (authentication)

## 📋 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Anthropic API key

### Installation

1. Clone the repository
```bash
cd AIJobTrackerKuldeep
```

2. Install all dependencies
```bash
npm run install:all
```

3. Setup environment variables
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and Anthropic API key
```

4. Run the application
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## 📁 Project Structure

```
AIJobTrackerKuldeep/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── config/             # Configuration files
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   ├── app.js
│   └── package.json
│
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `PATCH /api/jobs/:id/status` - Update job status

### AI Features
- `POST /api/ai/analyze-resume` - Analyze resume against jobs
- `POST /api/ai/cover-letter` - Generate cover letter
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/interview-prep` - Generate interview questions
- `GET /api/ai/insights` - Get AI insights for dashboard

### Resumes
- `POST /api/resumes` - Upload resume
- `GET /api/resumes` - List user's resumes
- `DELETE /api/resumes/:id` - Delete resume

## 🎨 UI Design

Dark glassmorphism theme with:
- Deep navy background (#0a0f1e)
- Indigo accent color (#6366f1)
- Frosted glass card effects
- Smooth animations with Framer Motion

## 🤖 Kanban Columns

1. 🔖 Wishlist - Job saved to apply later
2. 📤 Applied - Application submitted
3. 🔍 Screening - Initial screening phase
4. 🎯 Interviews - Interview scheduled
5. 💼 Offer - Received job offer
6. ❌ Closed - Application closed/rejected

## 📝 License

MIT

---

Built by Kuldeep • AI-Powered Job Tracking
