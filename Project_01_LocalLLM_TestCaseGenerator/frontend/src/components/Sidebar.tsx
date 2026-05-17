import React from 'react';

interface SidebarProps {
  currentView: 'chat' | 'settings';
  setCurrentView: (view: 'chat' | 'settings') => void;
  history: Array<{id: string, title: string}>;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, history }) => {
  return (
    <div className="sidebar glass-panel" style={{
      width: '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--surface-border)',
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      padding: '1rem',
      gap: '1rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>AI2xBlueprint</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Test Case Generator</p>
      </div>

      <button 
        onClick={() => setCurrentView('chat')}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: currentView === 'chat' ? 'var(--primary-color)' : 'transparent',
          color: currentView === 'chat' ? '#fff' : 'var(--text-primary)',
          border: 'none',
          textAlign: 'left',
          fontWeight: '500'
        }}
      >
        Chat Generation
      </button>

      <button 
        onClick={() => setCurrentView('settings')}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: currentView === 'settings' ? 'var(--primary-color)' : 'transparent',
          color: currentView === 'settings' ? '#fff' : 'var(--text-primary)',
          border: 'none',
          textAlign: 'left',
          fontWeight: '500'
        }}
      >
        Settings
      </button>

      <div style={{ marginTop: '2rem', flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: '1rem' }}>History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No history yet.</p>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '6px', 
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                }}
              >
                {item.title}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
