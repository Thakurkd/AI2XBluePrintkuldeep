import React from 'react';
import { motion } from 'framer-motion';

export const KanbanColumn = ({ status, title, jobs, onStatusChange, onDelete }) => {
  return (
    <motion.div
      layout
      className="glass-card flex-1 p-4 rounded-lg min-h-screen"
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-textPrimary">
          {title} ({jobs.length})
        </h2>
      </div>

      <div className="space-y-3 pb-4">
        {jobs && jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job._id} className="glass-card p-3 rounded hover:shadow-md transition-all">
              <h3 className="font-semibold text-textPrimary text-sm">{job.title}</h3>
              <p className="text-textMuted text-xs">{job.company}</p>
              <div className="mt-2 flex justify-between text-xs text-textMuted">
                <span>AI Score: {job.aiMatchScore}%</span>
                <button
                  onClick={() => onDelete(job._id)}
                  className="text-danger hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-textMuted py-8">
            <p className="text-sm">No jobs yet</p>
          </div>
        )}
      </div>

      <button className="w-full mt-4 btn-secondary text-sm">
        + Add Job
      </button>
    </motion.div>
  );
};
