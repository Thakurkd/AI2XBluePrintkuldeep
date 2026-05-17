import React, { useState } from 'react';

interface ChatViewProps {
  settings: any;
  onSaveHistory: (item: {id: string, title: string}) => void;
  onSettingsChange: (settings: any) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ settings, onSaveHistory, onSettingsChange }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.selectedProvider,
          model: settings.selectedModel,
          apiKey: settings[`${settings.selectedProvider}ApiKey`],
          endpoint: settings[`${settings.selectedProvider}Endpoint`],
          systemPrompt: 'You are an expert QA Engineer. Generate comprehensive functional and non-functional test cases based on the provided Jira requirement.',
          userPrompt: prompt
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }
      
      setResponse(data.result);
      
      onSaveHistory({
        id: Date.now().toString(),
        title: prompt.substring(0, 30) + '...'
      });
      
    } catch (error: any) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '2rem', borderRadius: '12px', padding: '1.5rem' }} className="glass-panel">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>
          Test Case generated with {settings.selectedProvider.toUpperCase()}
        </h2>
        
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div className="loader" style={{ 
              width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', 
              borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' 
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : response ? (
          <div className="jira-markdown" dangerouslySetInnerHTML={{ __html: formatJiraToHtml(response) }} />
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            Generated test cases will appear here...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Requirements</label>
          <select 
            value={settings.selectedProvider}
            onChange={(e) => onSettingsChange({ ...settings, selectedProvider: e.target.value })}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--surface-border)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="ollama">Ollama (Local)</option>
            <option value="lmstudio">LM Studio (Local)</option>
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask here or paste TC for Requirement..."
            style={{ flex: 1, minHeight: '80px', borderRadius: '12px' }}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            style={{
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0 2rem',
              fontWeight: '600',
              opacity: (loading || !prompt.trim()) ? 0.5 : 1
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic Jira Markdown to HTML formatter for display purposes
function formatJiraToHtml(text: string) {
  let html = text
    .replace(/h1\.\s+(.*)/g, '<h1>$1</h1>')
    .replace(/h2\.\s+(.*)/g, '<h2>$1</h2>')
    .replace(/h3\.\s+(.*)/g, '<h3>$1</h3>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\{\{([^}]*)\}\}/g, '<code>$1</code>')
    .replace(/\{code\}([\s\S]*?)\{code\}/g, '<pre><code>$1</code></pre>')
    .replace(/\|\|(.*?)\|\|/g, '<th>$1</th>') // table headers
    .replace(/\|(.*?)\|/g, '<td>$1</td>')    // table cells
    .replace(/\n/g, '<br/>');
  return html;
}

export default ChatView;
