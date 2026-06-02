/**
 * Ollama Local AI Service
 * Connects to local Ollama instance running at http://localhost:11434
 * Uses llama3.2 model for the AI Assistant chat
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Check if Ollama is running and the model is available
 */
export const checkOllamaHealth = async () => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return { available: false, reason: 'Ollama server not responding' };

    const data = await response.json();
    const models = data.models || [];
    const modelNames = models.map((m) => m.name);

    // Check if llama3.2 is available (model name can be "llama3.2", "llama3.2:latest", etc.)
    const hasModel = modelNames.some(
      (name) => name.startsWith('llama3.2') || name.startsWith('llama3:')
    );

    return {
      available: true,
      hasModel,
      models: modelNames,
      reason: hasModel ? 'ready' : `Model ${OLLAMA_MODEL} not found. Run: ollama pull llama3.2`,
    };
  } catch (error) {
    return { available: false, reason: `Ollama not reachable: ${error.message}` };
  }
};

/**
 * Send a chat message to Ollama and get a response
 * @param {Array} messages - Array of {role, content} objects
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<{text: string, model: string}>}
 */
export const ollamaChat = async (messages, systemPrompt = '') => {
  const formattedMessages = [];

  // Add system prompt as first message if provided
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }

  // Add conversation history
  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 512,
      },
    }),
    signal: AbortSignal.timeout(60000), // 60s timeout for model generation
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.message?.content || data.response || '';

  return {
    text,
    model: OLLAMA_MODEL,
    provider: 'ollama',
  };
};

/**
 * Pull a model from Ollama registry (async — for setup)
 */
export const pullOllamaModel = async (modelName = OLLAMA_MODEL) => {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: modelName, stream: false }),
    signal: AbortSignal.timeout(300000), // 5 minutes for download
  });
  return response.ok;
};
