import express from 'express';
import {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  updateJobStatus,
} from '../controllers/job.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getJobs);
router.post('/', createJob);
router.get('/:id', getJobById);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.patch('/:id/status', updateJobStatus);

export default router;
