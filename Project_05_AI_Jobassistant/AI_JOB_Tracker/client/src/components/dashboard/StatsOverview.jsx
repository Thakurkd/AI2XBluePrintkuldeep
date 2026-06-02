import React from 'react';
import { motion } from 'framer-motion';

export const StatsOverview = ({ stats }) => {
  const statCards = [
    { label: 'Total Applied', value: stats?.applied || 0, icon: '📤', color: 'blue' },
    { label: 'In Progress', value: stats?.screening || 0, icon: '🔍', color: 'yellow' },
    { label: 'Interviews', value: stats?.interviews || 0, icon: '🎯', color: 'purple' },
    { label: 'Offers', value: stats?.offers || 0, icon: '💼', color: 'green' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass-card p-4 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{stat.icon}</span>
            <div>
              <p className="text-textMuted text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-textPrimary">{stat.value}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
