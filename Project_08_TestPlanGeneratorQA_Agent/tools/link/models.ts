/**
 * Link handshake 2.4 — live model lists.
 *
 * The sketch's "Select your model here" must not be a hardcoded array that rots
 * (findings.md §9). This proves each provider's list endpoint and shows what the
 * Settings dropdown will actually contain.
 *
 *   npm run link:models                        -> every provider with a key
 *   npm run link:models -- --provider groq
 */
import axios from 'axios';
import { env, args, heading, line, pass, fail, explain } from './_env.js';

interface ProviderSpec {
    id: string;
    label: string;
    keyVar?: string;
    url: (key: string) => string;
    headers: (key: string) => Record<string, string>;
    extract: (data: any) => string[];
}

const PROVIDERS: ProviderSpec[] = [
    {
        id: 'groq',
        label: 'Groq Cloud',
        keyVar: 'GROQ_API_KEY',
        url: () => 'https://api.groq.com/openai/v1/models',
        headers: (key) => ({ Authorization: `Bearer ${key}` }),
        extract: (data) => (data.data ?? []).map((m: any) => m.id),
    },
    {
        id: 'xai',
        label: 'Grok (xAI)',
        keyVar: 'XAI_API_KEY',
        url: () => 'https://api.x.ai/v1/models',
        headers: (key) => ({ Authorization: `Bearer ${key}` }),
        extract: (data) => (data.data ?? []).map((m: any) => m.id),
    },
    {
        id: 'openai',
        label: 'OpenAI',
        keyVar: 'OPENAI_API_KEY',
        url: () => 'https://api.openai.com/v1/models',
        headers: (key) => ({ Authorization: `Bearer ${key}` }),
        extract: (data) => (data.data ?? []).map((m: any) => m.id),
    },
    {
        id: 'claude',
        label: 'Claude',
        keyVar: 'ANTHROPIC_API_KEY',
        url: () => 'https://api.anthropic.com/v1/models',
        headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
        extract: (data) => (data.data ?? []).map((m: any) => m.id),
    },
    {
        id: 'gemini',
        label: 'Gemini',
        keyVar: 'GEMINI_API_KEY',
        url: () => 'https://generativelanguage.googleapis.com/v1beta/models',
        headers: (key) => ({ 'x-goog-api-key': key }),
        extract: (data) =>
            (data.models ?? [])
                .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
                .map((m: any) => String(m.name).replace(/^models\//, '')),
    },
    {
        id: 'ollama',
        label: 'Ollama (local)',
        url: () => env('OLLAMA_ENDPOINT', 'http://localhost:11434/api/chat').replace(/\/api\/chat$/, '/api/tags'),
        headers: () => ({}),
        extract: (data) => (data.models ?? []).map((m: any) => m.name),
    },
];

const flags = args();
const wanted = flags.provider ? PROVIDERS.filter((p) => p.id === flags.provider.toLowerCase()) : PROVIDERS;

if (!wanted.length) {
    fail(`Unknown provider "${flags.provider}". Supported: ${PROVIDERS.map((p) => p.id).join(', ')}`);
}

let reachable = 0;
let skipped = 0;

for (const spec of wanted) {
    heading(`${spec.label} — model list`);
    const key = spec.keyVar ? env(spec.keyVar) : '';

    if (spec.keyVar && !key) {
        line('status', `skipped — ${spec.keyVar} not set`);
        line('in the UI', 'listed as a provider, but Test Connection will fail until a key is supplied');
        skipped++;
        continue;
    }

    try {
        const { data } = await axios.get(spec.url(key), { headers: spec.headers(key), timeout: 30_000 });
        const models = spec.extract(data).sort();
        line('status', `ok — ${models.length} model(s)`);
        for (const m of models.slice(0, 25)) line('', m);
        if (models.length > 25) line('', `… and ${models.length - 25} more`);
        reachable++;
    } catch (error: any) {
        if (spec.id === 'ollama' && (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND')) {
            line('status', 'not running — start it with `ollama serve` to use local models');
            skipped++;
            continue;
        }
        line('status', `FAILED — ${explain(error, 'model list')}`);
        line('fallback', 'the dropdown falls back to a curated list and stays free-text');
    }
}

pass(`${reachable} provider(s) listed models, ${skipped} skipped for missing key or service.`);
