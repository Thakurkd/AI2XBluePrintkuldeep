import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
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
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
    },
    salary: {
      type: String,
      default: 'Not specified',
    },
    status: {
      type: String,
      enum: ['wishlist', 'applied', 'screening', 'interviews', 'offer', 'closed'],
      default: 'wishlist',
    },
    tags: [String],
    notes: String,
    appliedDate: Date,
    deadline: Date,
    jobUrl: String,
    isUrgent: {
      type: Boolean,
      default: false,
    },
    aiMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

jobSchema.index({ userId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ company: 1 });

export const Job = mongoose.model('Job', jobSchema);
