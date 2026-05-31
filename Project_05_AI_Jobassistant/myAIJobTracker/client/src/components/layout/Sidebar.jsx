import React from 'react';

export const Sidebar = ({ currentPage, setCurrentPage }) => {
  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'board', label: 'Kanban Board', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'resumes', label: 'Resumes', icon: '📄' },
    { id: 'interviews', label: 'Interviews', icon: '🎤' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖' },
  ];

  return (
    <div className="glass-card w-64 h-screen p-4 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
      </div>

      <div className="space-y-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setCurrentPage(page.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              currentPage === page.id
                ? 'bg-primary text-white'
                : 'text-textMuted hover:bg-card hover:text-textPrimary'
            }`}
          >
            {page.icon} {page.label}
          </button>
        ))}
      </div>
    </div>
  );
};
