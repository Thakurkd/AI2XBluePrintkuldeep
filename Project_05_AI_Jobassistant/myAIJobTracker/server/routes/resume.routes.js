import express from 'express';
import {
  uploadResume,
  getResumes,
  deleteResume,
} from '../controllers/resume.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', uploadResume);
router.get('/', getResumes);
router.delete('/:id', deleteResume);

export default router;
