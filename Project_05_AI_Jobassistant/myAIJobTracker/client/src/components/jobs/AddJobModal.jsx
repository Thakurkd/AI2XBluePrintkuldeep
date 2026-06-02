import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const AddJobModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Remote',
    salary: '',
    tags: '',
    jobUrl: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()),
    });
    setFormData({
      title: '',
      company: '',
      location: 'Remote',
      salary: '',
      tags: '',
      jobUrl: '',
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card p-6 max-w-md w-full mx-4"
      >
        <h2 className="text-2xl font-bold mb-4">Add New Job</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Job Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
            required
          />

          <input
            type="text"
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
          />

          <input
            type="text"
            placeholder="Salary"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
          />

          <input
            type="text"
            placeholder="Tags (comma-separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
          />

          <input
            type="url"
            placeholder="Job URL"
            value={formData.jobUrl}
            onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
            className="w-full bg-card text-textPrimary px-3 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
          />

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 btn-primary">
              Add Job
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
