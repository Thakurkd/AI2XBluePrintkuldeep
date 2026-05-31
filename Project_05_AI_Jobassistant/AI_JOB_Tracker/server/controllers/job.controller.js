import { Job } from '../models/Job.js';

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const jobData = { ...req.body, userId: req.userId };
    const job = new Job(jobData);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['wishlist', 'applied', 'screening', 'interviews', 'offer', 'closed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status, appliedDate: status === 'applied' ? new Date() : undefined },
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
