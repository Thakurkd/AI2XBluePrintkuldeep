import React, { useState, useEffect } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';

function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  const [history, setHistory] = useState<Array<{id: string, title: string}>>([]);
  const [settings, setSettings] = useState({
    ollamaEndpoint: 'http://localhost:11434/api/chat',
    lmStudioEndpoint: 'http://localhost:1234/v1/chat/completions',
    groqApiKey: '',
    openAIApiKey: '',
    claudeApiKey: '',
    geminiApiKey: '',
    selectedProvider: 'ollama',
    selectedModel: 'llama3'
  });

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tc_gen_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
    const savedSettings = localStorage.getItem('tc_gen_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSaveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('tc_gen_settings', JSON.stringify(newSettings));
  };

  const handleSaveHistory = (newHistoryItem: {id: string, title: string}) => {
    const updatedHistory = [newHistoryItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('tc_gen_history', JSON.stringify(updatedHistory));
  };

  return (
    <div className="app-container" style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        history={history} 
      />
      
      <main className="main-content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentView === 'chat' ? (
          <ChatView 
            settings={settings} 
            onSaveHistory={handleSaveHistory}
            onSettingsChange={handleSaveSettings}
          />
        ) : (
          <SettingsView 
            settings={settings} 
            onSave={handleSaveSettings} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
