import React from 'react';
import { motion } from 'framer-motion';

export const Analytics = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold">Analytics</h1>
        <p className="text-textMuted">Track your job search performance</p>
      </div>

      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">📊 Coming Soon</h2>
        <p className="text-textMuted">
          Analytics dashboard with charts showing your application trends,
          response rates, and more.
        </p>
      </div>
    </motion.div>
  );
};
