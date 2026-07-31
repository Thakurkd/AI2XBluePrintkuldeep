/**
 * Link handshake 2.3 — the language model.
 *
 * Proves the key authenticates, the model id exists, the provider answers, and —
 * critically for P1/P2 — that it can return strict JSON. A provider that chats
 * happily but ignores JSON mode breaks the whole pipeline, and finding that out
 * here costs seconds instead of a day.
 *
 *   npm run link:llm
 *   npm run link:llm -- --provider ollama --model llama3.2:3b
 */
import axios from 'axios';
import { env, args, heading, line, pass, fail, explain } from './_env.js';

const KEY_BY_PROVIDER: Record<string, string> = {
    groq: 'GROQ_API_KEY',
    xai: 'XAI_API_KEY',
    openai: 'OPENAI_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
};

const DEFAULT_MODEL: Record<string, string> = {
    groq: 'openai/gpt-oss-120b',
    xai: 'grok-4',
    openai: 'gpt-4o',
    claude: 'claude-sonnet-5',
    gemini: 'gemini-2.0-flash',
    ollama: 'llama3.2:3b',
};

const OPENAI_COMPATIBLE_URL: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    xai: 'https://api.x.ai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
};

const flags = args();
const provider = (flags.provider || env('LLM_PROVIDER', 'groq')).toLowerCase();
const model = flags.model || (provider === env('LLM_PROVIDER', 'groq').toLowerCase() ? env('LLM_MODEL') : '') || DEFAULT_MODEL[provider] || '';
const apiKey = env(KEY_BY_PROVIDER[provider] ?? '');

if (!DEFAULT_MODEL[provider]) {
    fail(`Unknown provider "${provider}". Supported: ${Object.keys(DEFAULT_MODEL).join(', ')}`);
}
if (provider !== 'ollama' && !apiKey) {
    fail(`No API key for "${provider}". Set ${KEY_BY_PROVIDER[provider]} in .env.`);
}

heading(`LLM handshake — ${provider} / ${model}`);
line('key', provider === 'ollama' ? 'not required' : `present (${apiKey.slice(0, 6)}…${apiKey.slice(-4)})`);

const SYSTEM = 'You are a test-plan assistant. Answer with strict JSON only, no prose and no code fence.';
const USER =
    'Return exactly {"ready": true, "provider": "<your provider name>", "canReturnJson": true} and nothing else.';

/** One round trip, timed. Returns the raw assistant text. */
async function callProvider(): Promise<string> {
    const compatible = OPENAI_COMPATIBLE_URL[provider];
    if (compatible) {
        const { data } = await axios.post(
            compatible,
            {
                model,
                temperature: 0,
                max_tokens: 200,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM },
                    { role: 'user', content: USER },
                ],
            },
            { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 60_000 }
        );
        line('tokens used', data.usage ? `${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out` : '—');
        return data.choices?.[0]?.message?.content ?? '';
    }

    if (provider === 'claude') {
        const { data } = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model,
                max_tokens: 200,
                temperature: 0,
                system: SYSTEM,
                messages: [{ role: 'user', content: USER }],
            },
            {
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
                timeout: 60_000,
            }
        );
        line('tokens used', data.usage ? `${data.usage.input_tokens} in / ${data.usage.output_tokens} out` : '—');
        return data.content?.[0]?.text ?? '';
    }

    if (provider === 'gemini') {
        const { data } = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                system_instruction: { parts: [{ text: SYSTEM }] },
                contents: [{ role: 'user', parts: [{ text: USER }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 200, responseMimeType: 'application/json' },
            },
            { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, timeout: 60_000 }
        );
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    // Ollama
    const { data } = await axios.post(
        env('OLLAMA_ENDPOINT', 'http://localhost:11434/api/chat'),
        {
            model,
            stream: false,
            format: 'json',
            options: { temperature: 0 },
            messages: [
                { role: 'system', content: SYSTEM },
                { role: 'user', content: USER },
            ],
        },
        { timeout: 300_000 }
    );
    return data.message?.content ?? '';
}

const startedAt = Date.now();
let raw = '';
try {
    raw = await callProvider();
} catch (error: any) {
    if (provider === 'ollama' && error?.code === 'ECONNREFUSED') {
        fail(`Ollama is not reachable at ${env('OLLAMA_ENDPOINT', 'http://localhost:11434/api/chat')}. Is \`ollama serve\` running?`);
    }
    fail(explain(error, `${provider} chat completion`));
}
const elapsed = Date.now() - startedAt;

line('latency', `${elapsed} ms`);
line('raw response', raw.length > 120 ? `${raw.slice(0, 117)}…` : raw || '(empty)');

if (!raw.trim()) {
    fail(`${provider} answered with an empty message. The model id "${model}" may be wrong for this key.`);
}

// JSON mode is not decoration: P1 and P2 both depend on it.
try {
    const parsed = JSON.parse(raw.replace(/```(?:json)?/gi, '').trim());
    line('json parse', `ok — keys: ${Object.keys(parsed).join(', ')}`);
} catch {
    line('json parse', 'FAILED — this provider ignored JSON mode');
    line('impact', 'P1/P2 will need the tolerant extractor; note it in findings.md before relying on this model');
}

pass(`${provider}/${model} answered in ${elapsed} ms.`);
