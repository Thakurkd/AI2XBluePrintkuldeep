import express from 'express';
import {
  analyzeResumeHandler,
  generateCoverLetterHandler,
  interviewPrepHandler,
  chatHandler,
  getInsights,
} from '../controllers/ai.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/analyze-resume', analyzeResumeHandler);
router.post('/cover-letter', generateCoverLetterHandler);
router.post('/interview-prep', interviewPrepHandler);
router.post('/chat', chatHandler);
router.get('/insights', getInsights);

export default router;
