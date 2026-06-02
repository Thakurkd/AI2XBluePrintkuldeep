import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { errorMiddleware } from './middleware/auth.middleware.js';

import authRoutes from './routes/auth.routes.js';
import jobRoutes from './routes/job.routes.js';
import aiRoutes from './routes/ai.routes.js';
import resumeRoutes from './routes/resume.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resumes', resumeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorMiddleware);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API docs: http://localhost:${PORT}/api`);
});
// Trigger nodemon reload
