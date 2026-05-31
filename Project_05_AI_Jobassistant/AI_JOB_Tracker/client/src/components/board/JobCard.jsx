import React from 'react';
import { motion } from 'framer-motion';
import { helpers } from '../../utils/helpers.js';

export const JobCard = ({ job, onStatusChange, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`glass-card p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all border-l-4 ${helpers.getStatusColor(job.status)}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-textPrimary">{job.title}</h3>
          <p className="text-textMuted text-sm">{job.company}</p>
        </div>
        {job.isUrgent && <span className="text-red-500 text-lg">🔴</span>}
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center text-xs text-textMuted">
          <span>📍 {job.location}</span>
        </div>
        <div className="flex items-center text-xs text-textMuted">
          <span>💰 {job.salary}</span>
        </div>
        <div className="flex items-center text-xs text-success">
          <span>🎯 Match: {job.aiMatchScore}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {job.tags?.slice(0, 2).map((tag, idx) => (
          <span key={idx} className="text-xs bg-primary bg-opacity-20 text-primary px-2 py-1 rounded">
            {tag}
          </span>
        ))}
        {job.tags?.length > 2 && (
          <span className="text-xs text-textMuted">+{job.tags.length - 2}</span>
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-textMuted border-t border-white border-opacity-10 pt-2">
        <span>{helpers.daysAgo(job.appliedDate)}</span>
        <button
          onClick={() => onDelete(job._id)}
          className="text-danger hover:text-red-400"
        >
          🗑️
        </button>
      </div>
    </motion.div>
  );
};
