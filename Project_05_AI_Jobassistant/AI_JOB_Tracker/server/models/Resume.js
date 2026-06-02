import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    fileUrl: String,
    isPrimary: {
      type: Boolean,
      default: false,
    },
    aiScore: Number,
    matchedJobs: [
      {
        jobId: mongoose.Schema.Types.ObjectId,
        matchPercentage: Number,
        suggestions: String,
      },
    ],
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1 });

export const Resume = mongoose.model('Resume', resumeSchema);
