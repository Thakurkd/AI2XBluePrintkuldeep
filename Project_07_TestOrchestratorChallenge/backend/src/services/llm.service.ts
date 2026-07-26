import axios from 'axios';
import { LLMConfig } from '../config';

export interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
    /** Ask the provider for strict JSON where it supports a JSON mode. */
    json?: boolean;
}

interface ProviderError extends Error {
    status?: number;
    retryAfterMs?: number;
}

/** Seconds to wait, from the Retry-After header or the message the provider embeds it in. */
function retryAfterMs(error: any): number | undefined {
    const header = error.response?.headers?.['retry-after'];
    if (header && !Number.isNaN(Number(header))) return Number(header) * 1000;

    const message: string = error.response?.data?.error?.message ?? '';
    const match = message.match(/try again in ([\d.]+)s/i);
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : undefined;
}

function fail(provider: string, error: any): never {
    const data = error.response?.data;
    const detail =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        error.message ||
        'unknown error';
    const status = error.response?.status;
    const thrown: ProviderError = new Error(
        `${provider} error${status ? ` (HTTP ${status})` : ''}: ${
            typeof detail === 'string' ? detail : JSON.stringify(detail)
        }`
    );
    thrown.status = status;
    thrown.retryAfterMs = retryAfterMs(error);
    throw thrown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Free tiers rate-limit by tokens per minute, and a two-call pipeline trips that
 * routinely. Wait out the window the provider tells us to wait rather than
 * surfacing a 429 the user can do nothing about.
 */
async function withRateLimitRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const { status, retryAfterMs: wait } = error as ProviderError;
            if (status !== 429 || attempt >= attempts) throw error;
            await sleep(Math.min(wait ?? attempt * 5000, 60_000) + 500);
        }
    }
}

export async function chat(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions = {}
): Promise<string> {
    return withRateLimitRetry(() => callProvider(config, systemPrompt, userPrompt, options));
}

async function callProvider(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions
): Promise<string> {
    const { temperature = 0.2, maxTokens = 4000, json = false } = options;

    switch (config.provider) {
        case 'groq':
            return openAICompatible(
                'Groq',
                'https://api.groq.com/openai/v1/chat/completions',
                config,
                systemPrompt,
                userPrompt,
                { temperature, maxTokens, json }
            );
        case 'openai':
            return openAICompatible(
                'OpenAI',
                'https://api.openai.com/v1/chat/completions',
                config,
                systemPrompt,
                userPrompt,
                { temperature, maxTokens, json }
            );
        case 'claude':
            return claude(config, systemPrompt, userPrompt, { temperature, maxTokens });
        case 'gemini':
            return gemini(config, systemPrompt, userPrompt, { temperature, maxTokens, json });
        case 'ollama':
            return ollama(config, systemPrompt, userPrompt, { temperature, json });
        default:
            throw new Error(`Unsupported LLM provider: "${config.provider}"`);
    }
}

async function openAICompatible(
    label: string,
    url: string,
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, maxTokens, json }: Required<ChatOptions>
): Promise<string> {
    try {
        const { data } = await axios.post(
            url,
            {
                model: config.model,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                ...(json ? { response_format: { type: 'json_object' } } : {}),
            },
            {
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 180_000,
            }
        );
        return data.choices?.[0]?.message?.content ?? '';
    } catch (error: any) {
        fail(label, error);
    }
}

async function claude(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, maxTokens }: { temperature: number; maxTokens: number }
): Promise<string> {
    try {
        const { data } = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: config.model,
                max_tokens: maxTokens,
                temperature,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            },
            {
                headers: {
                    'x-api-key': config.apiKey ?? '',
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json',
                },
                timeout: 180_000,
            }
        );
        return data.content?.[0]?.text ?? '';
    } catch (error: any) {
        fail('Claude', error);
    }
}

async function gemini(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, maxTokens, json }: { temperature: number; maxTokens: number; json: boolean }
): Promise<string> {
    try {
        const { data } = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
            {
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    ...(json ? { responseMimeType: 'application/json' } : {}),
                },
            },
            {
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey ?? '' },
                timeout: 180_000,
            }
        );
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (error: any) {
        fail('Gemini', error);
    }
}

async function ollama(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, json }: { temperature: number; json: boolean }
): Promise<string> {
    try {
        const { data } = await axios.post(
            config.endpoint ?? 'http://localhost:11434/api/chat',
            {
                model: config.model,
                stream: false,
                options: { temperature },
                ...(json ? { format: 'json' } : {}),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            },
            { timeout: 300_000 }
        );
        return data.message?.content ?? '';
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Ollama is not reachable. Is `ollama serve` running on port 11434?');
        }
        fail('Ollama', error);
    }
}

/**
 * Models wrap JSON in prose or fences even when asked not to. Take the largest
 * balanced {...} or [...] span and parse that.
 */
export function parseJSON<T>(raw: string): T {
    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        // fall through to extraction
    }

    const firstObject = cleaned.indexOf('{');
    const firstArray = cleaned.indexOf('[');
    const candidates = [firstObject, firstArray].filter((i) => i !== -1);
    if (candidates.length) {
        const start = Math.min(...candidates);
        const open = cleaned[start];
        const close = open === '{' ? '}' : ']';
        const end = cleaned.lastIndexOf(close);
        if (end > start) {
            try {
                return JSON.parse(cleaned.slice(start, end + 1)) as T;
            } catch {
                // fall through to error
            }
        }
    }
    throw new Error(
        `The model did not return valid JSON. First 300 chars of the response:\n${cleaned.slice(0, 300)}`
    );
}

/** Strip markdown fences from a code response so the editor gets bare source. */
export function stripCodeFences(raw: string): string {
    const fenced = raw.match(/```[a-zA-Z#+]*\s*\n([\s\S]*?)```/);
    return (fenced ? fenced[1] : raw).trim();
}
