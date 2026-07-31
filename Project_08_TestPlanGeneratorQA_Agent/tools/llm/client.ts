/**
 * One chat interface over six providers.
 *
 * Carried over from Project_07's llm.service.ts, which was proven in production,
 * plus xAI (Grok) — OpenAI-compatible, so it is a URL and a label. Note that
 * `groq` and `xai` are different products (findings.md §8).
 */
import axios from 'axios';
import { LLMConfig } from '../../server/types.js';

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
    let detail =
        data?.error?.message || data?.error || data?.message || error.message || 'unknown error';
    const status = error.response?.status;

    // Groq's own words for "your JSON-mode reply was cut off or malformed" — it
    // says "validate" in some cases and "generate" in others. The raw message tells
    // the user to adjust a prompt they cannot see, so translate it.
    if (typeof detail === 'string' && /failed to (validate|generate) json/i.test(detail)) {
        detail =
            'the model produced JSON the provider rejected, usually because the reply ran past its token limit. ' +
            'Try fewer work items, or a model with more room.';
    }
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
 * A response cut off by the token cap is the worst kind of failure: the JSON it
 * produced up to that point often still parses (or the tolerant extractor
 * recovers a balanced prefix), so a *partial* analysis looks like a complete one
 * and every field after the cut is silently empty.
 *
 * Observed for real: a 2500-token cap truncated the analysis right after
 * `features`, and the plan rendered with a dozen sections quietly falling back to
 * template defaults. Every provider reports this; check it and refuse.
 */
function refuseIfTruncated(provider: string, truncated: boolean, maxTokens: number): void {
    if (!truncated) return;
    throw Object.assign(
        new Error(
            `${provider} hit the ${maxTokens}-token response limit and the reply was cut off mid-way. ` +
            `Anything after the cut would be silently missing, so it has been rejected rather than ` +
            `rendered as a half-empty plan. Try fewer work items, or a model with more room.`
        ),
        { status: 502 }
    );
}

/**
 * How long we are willing to wait out a rate limit — and this depends on where we
 * are running, because the cost of waiting is completely different.
 *
 * Measured on Groq's free tier (8,000 tokens/minute): analyze consumed 6,642 of
 * the window, so the cases call was refused with "try again in 27.21s". A 15s cap
 * turned a recoverable per-minute limit into a failed run, which is the wrong
 * trade locally where nothing is going to kill the process.
 *
 * On serverless the platform kills the function at 60s, so a 27s sleep risks
 * spending the whole request budget and returning a timeout that explains nothing.
 * There, fail fast and let the UI's "retry from here" resume with the analysis
 * already in hand.
 */
const SERVERLESS = Boolean(process.env.VERCEL);
const MAX_RETRY_WAIT_MS = SERVERLESS ? 12_000 : 35_000;
const RETRY_BUDGET_MS = SERVERLESS ? 35_000 : 90_000;

function humanDuration(ms: number): string {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 90) return `${seconds} seconds`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 90) return `${minutes} minutes`;
    return `${Math.round(minutes / 60)} hours`;
}

/**
 * Per-minute limits are worth waiting out — a plan run trips them routinely and
 * the window is seconds long. Per-day quotas are not: the provider reports a wait
 * measured in hours, and sleeping on that burns the request budget and returns a
 * timeout that explains nothing. Tell the user instead.
 */
async function withRateLimitRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
    const startedAt = Date.now();

    for (let attempt = 1; ; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const failure = error as ProviderError;
            if (failure.status !== 429) throw error;

            const wait = failure.retryAfterMs ?? attempt * 5000;
            const spent = Date.now() - startedAt;
            const outOfBudget = spent + wait > RETRY_BUDGET_MS;

            if (attempt >= attempts || wait > MAX_RETRY_WAIT_MS || outOfBudget) {
                failure.message =
                    `${failure.message}\n\nRate limit not worth waiting out here — retry in about ` +
                    `${humanDuration(wait)}. The steps already completed are kept, so "retry from here" ` +
                    `resumes rather than starting again. Switching to a model with a larger quota in ` +
                    `Settings avoids the wait entirely.`;
                throw failure;
            }
            console.warn(`[llm] rate limited; waiting ${Math.round(wait / 1000)}s before retrying`);
            await sleep(wait + 500);
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

const OPENAI_COMPATIBLE: Partial<Record<LLMConfig['provider'], { label: string; url: string }>> = {
    groq: { label: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions' },
    xai: { label: 'Grok (xAI)', url: 'https://api.x.ai/v1/chat/completions' },
    openai: { label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
};

async function callProvider(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    options: ChatOptions
): Promise<string> {
    const { temperature = 0.2, maxTokens = 4000, json = false } = options;

    const compatible = OPENAI_COMPATIBLE[config.provider];
    if (compatible) {
        return openAICompatible(compatible.label, compatible.url, config, systemPrompt, userPrompt, {
            temperature,
            maxTokens,
            json,
        });
    }

    switch (config.provider) {
        case 'claude':
            return claude(config, systemPrompt, userPrompt, { temperature, maxTokens });
        case 'gemini':
            return gemini(config, systemPrompt, userPrompt, { temperature, maxTokens, json });
        case 'ollama':
            return ollama(config, systemPrompt, userPrompt, { temperature, json, maxTokens });
        default:
            throw new Error(`Unsupported LLM provider: "${config.provider}"`);
    }
}

/**
 * Groq (and the OpenAI API it mirrors) reject `response_format: json_object` with
 * a 400 unless the word "json" appears somewhere in the messages. A prompt can
 * describe its output shape perfectly and still trip this, so the guarantee lives
 * here rather than in the prompts' wording — a future prompt edit cannot
 * reintroduce the failure.
 */
function ensureJsonMentioned(systemPrompt: string, userPrompt: string): string {
    if (/json/i.test(systemPrompt) || /json/i.test(userPrompt)) return systemPrompt;
    return `${systemPrompt}\n\nRespond with a single valid JSON object and nothing else.`;
}

/** Groq rejects the whole response when its JSON validator is unhappy. */
const JSON_MODE_REJECTED = /failed to (validate|generate) json/i;

async function openAICompatible(
    label: string,
    url: string,
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, maxTokens, json }: Required<ChatOptions>,
    /** Set when this is the retry that has already dropped strict JSON mode. */
    jsonModeDropped = false
): Promise<string> {
    const useJsonMode = json && !jsonModeDropped;
    const system = json ? ensureJsonMentioned(systemPrompt, userPrompt) : systemPrompt;

    try {
        const { data } = await axios.post(
            url,
            {
                model: config.model,
                temperature,
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: userPrompt },
                ],
                ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
            },
            {
                headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
                timeout: 180_000,
            }
        );
        refuseIfTruncated(label, data.choices?.[0]?.finish_reason === 'length', maxTokens);
        return data.choices?.[0]?.message?.content ?? '';
    } catch (error: any) {
        if (error.status === 502) throw error;

        /**
         * Strict JSON mode is a convenience, not the mechanism. When the provider's
         * own validator throws the whole response away with a 400, ask once more
         * without it and let `parseJSON` recover the object — that tolerant parser
         * exists precisely because JSON mode is honoured unevenly.
         *
         * If the real cause was length rather than shape, this retry surfaces it as
         * a truncation error instead, which says something the user can act on.
         */
        const rejected =
            error.response?.status === 400 &&
            JSON_MODE_REJECTED.test(
                String(error.response?.data?.error?.message ?? error.response?.data?.error ?? '')
            );

        if (useJsonMode && rejected) {
            console.warn(`[llm] ${label} rejected its own JSON mode; retrying without it`);
            return openAICompatible(
                label,
                url,
                config,
                systemPrompt,
                userPrompt,
                { temperature, maxTokens, json },
                true
            );
        }
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
        refuseIfTruncated('Claude', data.stop_reason === 'max_tokens', maxTokens);
        return data.content?.[0]?.text ?? '';
    } catch (error: any) {
        if (error.status === 502) throw error;
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
        refuseIfTruncated('Gemini', data.candidates?.[0]?.finishReason === 'MAX_TOKENS', maxTokens);
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } catch (error: any) {
        if (error.status === 502) throw error;
        fail('Gemini', error);
    }
}

async function ollama(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    { temperature, json, maxTokens }: { temperature: number; json: boolean; maxTokens: number }
): Promise<string> {
    try {
        const { data } = await axios.post(
            config.endpoint ?? 'http://localhost:11434/api/chat',
            {
                model: config.model,
                stream: false,
                options: { temperature, num_predict: maxTokens },
                ...(json ? { format: 'json' } : {}),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            },
            { timeout: 600_000 }
        );
        refuseIfTruncated('Ollama', data.done_reason === 'length', maxTokens);
        return data.message?.content ?? '';
    } catch (error: any) {
        if (error.status === 502) throw error;
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Ollama is not reachable. Is `ollama serve` running on port 11434?');
        }
        fail('Ollama', error);
    }
}

/**
 * Models wrap JSON in prose or fences even when asked not to, and JSON mode is
 * honoured unevenly across providers. Take the largest balanced {...} or [...]
 * span and parse that.
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
    throw Object.assign(
        new Error(
            `The model did not return valid JSON. First 300 characters of its response:\n${cleaned.slice(0, 300)}`
        ),
        { status: 502 }
    );
}
