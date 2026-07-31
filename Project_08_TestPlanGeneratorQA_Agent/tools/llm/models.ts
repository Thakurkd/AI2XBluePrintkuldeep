/**
 * Live model lists for the "Test Model" dropdown, plus a one-token connection test.
 *
 * The dropdown is fetched from the provider rather than hardcoded, because a
 * hardcoded list rots (findings.md §9). It is also filtered, because Groq's
 * /models includes models that cannot do chat completion at all — whisper
 * (speech-to-text), prompt-guard (classifier), orpheus (speech). Offering those
 * guarantees a baffling failure for whoever picks one (findings.md §11).
 */
import axios from 'axios';
import { LLMConfig, LLMProvider } from '../../server/types.js';
import { chat } from './client.js';

/** Model families that exist on chat endpoints but cannot answer a chat request. */
const NOT_CHAT =
    /(^|\/|-)(whisper|orpheus|prompt-guard|guard-\d|tts|text-to-speech|speech|embed(ding)?s?|moderation|dall-e|clip|rerank|distil-whisper|sora|veo|imagen|aqa)(-|$|\/)/i;

export function isChatModel(id: string): boolean {
    return !NOT_CHAT.test(id);
}

interface Spec {
    url: (config: LLMConfig) => string;
    headers: (config: LLMConfig) => Record<string, string>;
    extract: (data: any) => string[];
}

const SPECS: Record<LLMProvider, Spec> = {
    groq: {
        url: () => 'https://api.groq.com/openai/v1/models',
        headers: (c) => ({ Authorization: `Bearer ${c.apiKey}` }),
        extract: (d) => (d.data ?? []).map((m: any) => m.id),
    },
    xai: {
        url: () => 'https://api.x.ai/v1/models',
        headers: (c) => ({ Authorization: `Bearer ${c.apiKey}` }),
        extract: (d) => (d.data ?? []).map((m: any) => m.id),
    },
    openai: {
        url: () => 'https://api.openai.com/v1/models',
        headers: (c) => ({ Authorization: `Bearer ${c.apiKey}` }),
        extract: (d) => (d.data ?? []).map((m: any) => m.id),
    },
    claude: {
        url: () => 'https://api.anthropic.com/v1/models',
        headers: (c) => ({ 'x-api-key': c.apiKey ?? '', 'anthropic-version': '2023-06-01' }),
        extract: (d) => (d.data ?? []).map((m: any) => m.id),
    },
    gemini: {
        url: () => 'https://generativelanguage.googleapis.com/v1beta/models',
        headers: (c) => ({ 'x-goog-api-key': c.apiKey ?? '' }),
        extract: (d) =>
            (d.models ?? [])
                .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
                .map((m: any) => String(m.name).replace(/^models\//, '')),
    },
    ollama: {
        url: (c) => (c.endpoint ?? 'http://localhost:11434/api/chat').replace(/\/api\/chat$/, '/api/tags'),
        headers: () => ({}),
        extract: (d) => (d.models ?? []).map((m: any) => m.name),
    },
};

export interface ModelList {
    provider: LLMProvider;
    models: string[];
    /** Ids the provider returned that cannot chat — reported, not silently dropped. */
    excluded: string[];
    live: boolean;
    note?: string;
}

export async function listModels(config: LLMConfig): Promise<ModelList> {
    const spec = SPECS[config.provider];
    if (!spec) throw new Error(`Unsupported provider "${config.provider}"`);

    try {
        const { data } = await axios.get(spec.url(config), { headers: spec.headers(config), timeout: 20_000 });
        const all: string[] = spec.extract(data);
        const models = all.filter(isChatModel).sort();
        const excluded = all.filter((id) => !isChatModel(id)).sort();
        return { provider: config.provider, models, excluded, live: true };
    } catch (error: any) {
        // A failed list must not block the user: the field stays free text, so a
        // brand-new model id is never gated by our ability to enumerate it.
        const note =
            config.provider === 'ollama' && ['ECONNREFUSED', 'ENOTFOUND'].includes(error?.code)
                ? 'Ollama is not running. Start it with `ollama serve` to use local models.'
                : `Could not read the model list (${error?.response?.status ?? error?.code ?? 'network error'}). Type a model id instead.`;
        return { provider: config.provider, models: [], excluded: [], live: false, note };
    }
}

export interface ModelTest {
    ok: true;
    provider: string;
    model: string;
    latencyMs: number;
    jsonMode: boolean;
    reply: string;
}

/**
 * Test Connection for the model. Returns a real completion and its latency —
 * "ok" is not proof (gemini.md invariant 4). Also reports whether JSON mode was
 * honoured, because P1 and P2 both depend on it.
 */
export async function testModel(config: LLMConfig): Promise<ModelTest> {
    const startedAt = Date.now();
    const reply = await chat(
        config,
        'You are a test-plan assistant. Answer with strict JSON only, no prose and no code fence.',
        'Return exactly {"ready": true} and nothing else.',
        { temperature: 0, maxTokens: 200, json: true }
    );
    const latencyMs = Date.now() - startedAt;

    if (!reply.trim()) {
        throw Object.assign(
            new Error(
                `${config.provider} accepted the request but returned an empty message. ` +
                `The model id "${config.model}" may not exist for this key.`
            ),
            { status: 502 }
        );
    }

    let jsonMode = true;
    try {
        JSON.parse(reply.replace(/```(?:json)?/gi, '').trim());
    } catch {
        jsonMode = false;
    }

    return {
        ok: true,
        provider: config.provider,
        model: config.model,
        latencyMs,
        jsonMode,
        reply: reply.trim().slice(0, 200),
    };
}
