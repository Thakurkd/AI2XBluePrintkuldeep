import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../../services/aiService.js';
import { useJobStore } from '../../store/useJobStore.js';

export const AIInsightsPanel = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const jobs = useJobStore((state) => state.jobs);

  useEffect(() => {
    fetchInsights();
  }, [jobs]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await aiService.getInsights();
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-6 rounded-lg"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">✨ AI Insights</h3>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="text-primary hover:opacity-80"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {insights && (
        <div className="space-y-3">
          <div className="p-3 bg-primary bg-opacity-10 rounded">
            <p className="text-sm text-textPrimary">
              <strong>📊 Total Applications:</strong> {insights.totalJobs}
            </p>
          </div>

          <div className="p-3 bg-success bg-opacity-10 rounded">
            <p className="text-sm text-textPrimary">
              <strong>✅ Applied:</strong> {insights.applied}
            </p>
          </div>

          <div className="p-3 bg-warning bg-opacity-10 rounded">
            <p className="text-sm text-textPrimary">
              <strong>🎯 Avg Match:</strong> {insights.avgMatchScore}%
            </p>
          </div>

          <button
            onClick={fetchInsights}
            className="w-full btn-primary text-sm mt-4"
          >
            Run Full Analysis →
          </button>
        </div>
      )}
    </motion.div>
  );
};
