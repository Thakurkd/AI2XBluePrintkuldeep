import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(formData.email, formData.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card p-8 max-w-md w-full mx-4"
      >
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-textMuted mb-6">Sign in to AIJobTracker</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-card text-textPrimary px-4 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full bg-card text-textPrimary px-4 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};
