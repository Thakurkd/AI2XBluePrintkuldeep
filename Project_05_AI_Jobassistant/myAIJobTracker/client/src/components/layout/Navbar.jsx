import React from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <nav className="glass-card p-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🚀</span>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          AIJobTracker
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-textMuted">{user.name}</span>
            <button
              onClick={logout}
              className="btn-secondary text-sm"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
