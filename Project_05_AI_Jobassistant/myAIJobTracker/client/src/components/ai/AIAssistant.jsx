import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../../services/aiService.js';
import { useAIStore } from '../../store/useAIStore.js';

export const AIAssistant = () => {
  const { chatMessages, addChatMessage } = useAIStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    addChatMessage({ role: 'user', content: input });
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(
        chatMessages.concat({ role: 'user', content: input })
      );
      addChatMessage({ role: 'assistant', content: response.data.response });
    } catch (error) {
      console.error('Chat error:', error);
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
      <h2 className="text-2xl font-bold mb-4">🤖 AI Job Assistant</h2>

      <div className="space-y-4 h-96 overflow-y-auto mb-4 p-4 bg-background rounded">
        {chatMessages.length === 0 && (
          <div className="text-center text-textMuted">
            <p>Start a conversation about your job search!</p>
          </div>
        )}

        {chatMessages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card text-textPrimary'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your job search..."
          className="flex-1 bg-card text-textPrimary px-4 py-2 rounded border border-white border-opacity-10 focus:border-primary outline-none"
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '⏳' : '📤'}
        </button>
      </form>
    </motion.div>
  );
};
