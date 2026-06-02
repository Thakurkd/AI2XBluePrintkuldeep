import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from './components/layout/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Board } from './pages/Board.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { AIPage } from './pages/AIPage.jsx';
import { Login } from './components/auth/Login.jsx';
import { Register } from './components/auth/Register.jsx';
import { useAuthStore } from './store/useAuthStore.js';
import { useJobStore } from './store/useJobStore.js';
import { authService } from './services/authService.js';
import { jobService } from './services/jobService.js';
import './index.css';

export default function App() {
  const { isAuthenticated, setToken, setUser, user } = useAuthStore();
  const setJobs = useJobStore((state) => state.setJobs);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getMe()
        .then((res) => {
          setUser(res.data);
          return jobService.getAll();
        })
        .then((res) => {
          setJobs(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [setUser, setJobs]);

  const handleLogin = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      const jobs = await jobService.getAll();
      setJobs(jobs.data);
    } catch (error) {
      alert('Login failed: ' + error.response?.data?.message);
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      setToken(response.data.token);
      setUser(response.data.user);
      setJobs([]);
    } catch (error) {
      alert('Registration failed: ' + error.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-3xl">⏳ Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {authMode === 'login' ? (
          <div>
            <Login onLogin={handleLogin} />
            <div className="text-center mt-4">
              <button
                onClick={() => setAuthMode('register')}
                className="text-primary hover:underline"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Register onRegister={handleRegister} />
            <div className="text-center mt-4">
              <button
                onClick={() => setAuthMode('login')}
                className="text-primary hover:underline"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'board':
        return <Board />;
      case 'analytics':
        return <Analytics />;
      case 'ai-assistant':
        return <AIPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
