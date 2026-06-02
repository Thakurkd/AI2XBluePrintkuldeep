import React from 'react';
import { motion } from 'framer-motion';
import { AIAssistant } from '../components/ai/AIAssistant.jsx';

export const AIPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold">AI Assistant</h1>
        <p className="text-textMuted">Get AI-powered help with your job search</p>
      </div>

      <AIAssistant />
    </motion.div>
  );
};
