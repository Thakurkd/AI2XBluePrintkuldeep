import { Resume } from '../models/Resume.js';

export const uploadResume = async (req, res) => {
  try {
    const { title, content } = req.body;

    const resume = new Resume({
      userId: req.userId,
      title,
      content,
      isPrimary: true,
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
