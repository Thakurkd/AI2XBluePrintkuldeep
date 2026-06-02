# Setup & Installation Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Anthropic API key (get from https://console.anthropic.com/)

## Installation Steps

### 1. Navigate to project
```bash
cd myAIJobTracker
```

### 2. Install all dependencies
```bash
npm run install:all
```

### 3. Setup Environment Variables

Create `.env` files:

**Server** (`server/.env`):
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/aijobtracker
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**Client** (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (update MONGO_URI in .env)
```

### 5. Run Development Servers
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/api/health

## Project Structure

```
myAIJobTracker/
├── server/                 # Express.js Backend
│   ├── config/            # Database & environment config
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth & error handling
│   ├── services/          # Claude AI service
│   ├── app.js            # Express app
│   └── package.json
│
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .env.example
├── package.json
└── README.md
```

## Key Features

### 1. **Authentication**
- User registration and login
- JWT token-based authentication
- Password hashing with bcryptjs

### 2. **Job Management**
- Create, read, update, delete jobs
- Track application status (6 stages)
- AI match scoring
- Kanban board with drag-and-drop

### 3. **AI Features** (Claude API)
- Resume analysis and matching
- Cover letter generation
- Interview preparation questions
- AI job search assistant chat
- AI insights dashboard

### 4. **UI**
- Dark glassmorphism design
- Responsive layout
- Smooth animations (Framer Motion)
- Tailwind CSS styling

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `PATCH /api/jobs/:id/status` - Update status

### AI
- `POST /api/ai/analyze-resume` - Analyze resume
- `POST /api/ai/cover-letter` - Generate cover letter
- `POST /api/ai/interview-prep` - Generate interview Q&A
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/insights` - Get dashboard insights

### Resumes
- `POST /api/resumes` - Upload resume
- `GET /api/resumes` - List resumes
- `DELETE /api/resumes/:id` - Delete resume

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running (`mongod` command)
- Check `MONGO_URI` in `.env`
- Try connecting to MongoDB Atlas instead

### API Not Connecting
- Ensure backend is running on port 5000
- Check proxy setting in `vite.config.js`
- Clear browser cache

### Claude API Error
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check Anthropic account has valid API key
- Ensure API key has sufficient credits

## Development Tips

- Frontend hot-reloads on file changes
- Backend requires manual restart (use nodemon in dev)
- Check browser console for frontend errors
- Check server logs for API errors
- Use Postman or Insomnia to test API endpoints

## Next Steps

1. Create your first account
2. Add some job opportunities
3. Use Kanban board to organize applications
4. Try AI assistant for interview prep
5. Monitor analytics and insights

---

Built with ❤️ by Kuldeep • AI-Powered Job Tracking
