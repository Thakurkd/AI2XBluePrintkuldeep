import axios from 'axios';

export interface LLMRequestParams {
    provider: string; // 'ollama', 'lmstudio', 'groq', 'openai', 'claude', 'gemini'
    model?: string;
    apiKey?: string;
    systemPrompt: string;
    userPrompt: string;
    endpoint?: string;
}

export async function generateTestCase(params: LLMRequestParams): Promise<string> {
    const { provider, model, apiKey, systemPrompt, userPrompt, endpoint } = params;

    const formattedSystemPrompt = `${systemPrompt}\n\nIMPORTANT CONSTRAINT: You MUST format your entire response STRICTLY in Jira format, using Jira markup for tables, headings, and lists. Generate both functional and non-functional test cases.`;

    switch (provider.toLowerCase()) {
        case 'ollama':
            return await handleOllama(model, formattedSystemPrompt, userPrompt, endpoint);
        case 'lmstudio':
            return await handleLMStudio(model, formattedSystemPrompt, userPrompt, endpoint);
        case 'groq':
            return await handleGroq(model, apiKey, formattedSystemPrompt, userPrompt);
        case 'openai':
            return await handleOpenAI(model, apiKey, formattedSystemPrompt, userPrompt);
        case 'claude':
            return await handleClaude(model, apiKey, formattedSystemPrompt, userPrompt);
        case 'gemini':
            return await handleGemini(model, apiKey, formattedSystemPrompt, userPrompt);
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}

async function handleOllama(model: string = 'llama3', systemPrompt: string, userPrompt: string, endpoint: string = 'http://localhost:11434/api/chat') {
    try {
        const response = await axios.post(endpoint, {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false
        });
        return response.data.message?.content || 'No content received from Ollama.';
    } catch (error: any) {
        const details = error.response?.data?.error ? ` - ${error.response.data.error}` : '';
        throw new Error(`Ollama Error: ${error.message}${details}`);
    }
}

async function handleLMStudio(model: string = 'local-model', systemPrompt: string, userPrompt: string, endpoint: string = 'http://localhost:1234/v1/chat/completions') {
    try {
        const response = await axios.post(endpoint, {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        });
        return response.data.choices[0]?.message?.content || 'No content received from LM Studio.';
    } catch (error: any) {
        const details = error.response?.data?.error?.message || error.response?.data?.error || '';
        throw new Error(`LM Studio Error: ${error.message} ${details}`);
    }
}

async function handleGroq(model: string = 'llama3-8b-8192', apiKey?: string, systemPrompt: string = '', userPrompt: string = '') {
    if (!apiKey) throw new Error('Groq API Key is required');
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        return response.data.choices[0]?.message?.content || 'No content received from Groq.';
    } catch (error: any) {
        throw new Error(`Groq Error: ${error.response?.data?.error?.message || error.message}`);
    }
}

async function handleOpenAI(model: string = 'gpt-4o', apiKey?: string, systemPrompt: string = '', userPrompt: string = '') {
    if (!apiKey) throw new Error('OpenAI API Key is required');
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        return response.data.choices[0]?.message?.content || 'No content received from OpenAI.';
    } catch (error: any) {
        throw new Error(`OpenAI Error: ${error.response?.data?.error?.message || error.message}`);
    }
}

async function handleClaude(model: string = 'claude-3-haiku-20240307', apiKey?: string, systemPrompt: string = '', userPrompt: string = '') {
    if (!apiKey) throw new Error('Claude API Key is required');
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt }
            ]
        }, {
            headers: { 
                'x-api-key': apiKey, 
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json' 
            }
        });
        return response.data.content[0]?.text || 'No content received from Claude.';
    } catch (error: any) {
        throw new Error(`Claude Error: ${error.response?.data?.error?.message || error.message}`);
    }
}

async function handleGemini(model: string = 'gemini-1.5-flash', apiKey?: string, systemPrompt: string = '', userPrompt: string = '') {
    if (!apiKey) throw new Error('Gemini API Key is required');
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            system_instruction: { parts: { text: systemPrompt } },
            contents: [{ parts: [{ text: userPrompt }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No content received from Gemini.';
    } catch (error: any) {
        throw new Error(`Gemini Error: ${error.response?.data?.error?.message || error.message}`);
    }
}
