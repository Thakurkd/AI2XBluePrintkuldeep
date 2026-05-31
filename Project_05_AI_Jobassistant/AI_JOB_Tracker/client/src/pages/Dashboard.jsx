import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { StatsOverview } from '../components/dashboard/StatsOverview.jsx';
import { AIInsightsPanel } from '../components/ai/AIInsightsPanel.jsx';
import { useJobStore } from '../store/useJobStore.js';

export const Dashboard = () => {
  const jobs = useJobStore((state) => state.jobs);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const applied = jobs.filter((j) => j.status === 'applied').length;
    const screening = jobs.filter((j) => j.status === 'screening').length;
    const interviews = jobs.filter((j) => j.status === 'interviews').length;
    const offers = jobs.filter((j) => j.status === 'offer').length;

    setStats({ applied, screening, interviews, offers });
  }, [jobs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-textMuted">Your job search at a glance</p>
      </div>

      <StatsOverview stats={stats} />

      <div className="grid grid-cols-2 gap-6">
        <AIInsightsPanel />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-6 rounded-lg"
        >
          <h3 className="text-xl font-bold mb-4">📋 Recent Applications</h3>
          <div className="space-y-2">
            {jobs
              .filter((j) => j.status === 'applied')
              .slice(0, 5)
              .map((job) => (
                <div key={job._id} className="p-2 hover:bg-card rounded">
                  <p className="font-semibold text-sm">{job.title}</p>
                  <p className="text-xs text-textMuted">{job.company}</p>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
