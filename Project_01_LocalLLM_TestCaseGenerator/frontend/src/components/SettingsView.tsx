import React, { useState } from 'react';

interface SettingsViewProps {
  settings: any;
  onSave: (settings: any) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [testStatuses, setTestStatuses] = useState<Record<string, {status: 'idle' | 'loading' | 'success' | 'error', message: string}>>({});
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (key: string, value: string) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const handleSave = () => {
    onSave(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestConnection = async (provider: string) => {
    setTestStatuses(prev => ({ ...prev, [provider]: { status: 'loading', message: 'Testing...' } }));
    try {
      const defaultModels: Record<string, string> = {
        ollama: 'llama3',
        lmstudio: 'local-model',
        groq: 'llama3-8b-8192',
        openai: 'gpt-4o',
        claude: 'claude-3-haiku-20240307',
        gemini: 'gemini-1.5-flash'
      };

      const modelToTest = (localSettings.selectedProvider === provider && localSettings.selectedModel) 
                          ? localSettings.selectedModel 
                          : defaultModels[provider];
      
      const res = await fetch('http://localhost:3001/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider,
          model: modelToTest,
          apiKey: localSettings[`${provider}ApiKey`],
          endpoint: localSettings[`${provider}Endpoint`],
        })
      });
      
      const data = await res.json().catch(() => null);
      
      if (res.ok && data && data.success) {
        setTestStatuses(prev => ({ ...prev, [provider]: { status: 'success', message: 'Connection successful!' } }));
      } else {
        throw new Error(data?.error || 'Connection failed');
      }
    } catch (error: any) {
      const isNetworkError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
      setTestStatuses(prev => ({ 
        ...prev, 
        [provider]: { 
          status: 'error', 
          message: isNetworkError ? 'Failed to fetch (Ensure Backend is running on port 3001)' : error.message 
        } 
      }));
    }
  };

  const renderSettingGroup = (title: string, provider: string, inputKey: string, type: string, placeholder: string) => {
    const status = testStatuses[provider];
    return (
      <div className="setting-group" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--accent-color)' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
            type={type} 
            placeholder={placeholder} 
            value={localSettings[inputKey] || ''} 
            onChange={(e) => handleChange(inputKey, e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            onClick={() => handleTestConnection(provider)}
            disabled={status?.status === 'loading'}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              border: '1px solid var(--surface-border)',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '500',
              cursor: status?.status === 'loading' ? 'not-allowed' : 'pointer',
              minWidth: '80px'
            }}
          >
            {status?.status === 'loading' ? '...' : 'Test'}
          </button>
        </div>
        {status && status.status !== 'idle' && (
          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.85rem',
            color: status.status === 'success' ? 'var(--success-color)' : status.status === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'
          }}>
            {status.message}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
        <h2 style={{ marginBottom: '2rem', color: 'var(--primary-color)' }}>Configuration Settings</h2>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Active Provider</label>
          <select 
            value={localSettings.selectedProvider} 
            onChange={(e) => handleChange('selectedProvider', e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            <option value="ollama">Ollama</option>
            <option value="lmstudio">LM Studio</option>
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>

          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Model Name</label>
          <input 
            type="text" 
            value={localSettings.selectedModel || ''} 
            onChange={(e) => handleChange('selectedModel', e.target.value)}
            placeholder="e.g., llama3, gpt-4o"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)', margin: '2rem 0' }} />

        <div>
          {renderSettingGroup('Ollama API URL', 'ollama', 'ollamaEndpoint', 'text', 'http://localhost:11434/api/chat')}
          {renderSettingGroup('LM Studio API URL', 'lmstudio', 'lmStudioEndpoint', 'text', 'http://localhost:1234/v1/chat/completions')}
          {renderSettingGroup('Groq API Key', 'groq', 'groqApiKey', 'password', 'gsk_...')}
          {renderSettingGroup('OpenAI API Key', 'openai', 'openAIApiKey', 'password', 'sk-...')}
          {renderSettingGroup('Anthropic Claude API Key', 'claude', 'claudeApiKey', 'password', 'sk-ant-...')}
          {renderSettingGroup('Gemini API Key', 'gemini', 'geminiApiKey', 'password', 'AIza...')}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button 
            onClick={handleSave}
            style={{
              background: isSaved ? 'var(--success-color)' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontWeight: '600',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            {isSaved ? '✓ Settings Saved Successfully!' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;
