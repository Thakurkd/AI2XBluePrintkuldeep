import dotenv from 'dotenv';
import { JiraConfig, LLMConfig, LLMProvider } from './types.js';

// Loads .env for local dev. On Vercel there is no .env file, so the platform's
// environment is used as-is.
dotenv.config({ quiet: true });

const env = (key: string, fallback = '') => (process.env[key] ?? fallback).trim();

export const PORT = Number(env('PORT', '5008'));

/**
 * Secrets live in .env on the server. The frontend may send partial overrides —
 * a different site, a different project — without ever holding the tokens, so
 * anything the request omits falls back to the environment (gemini.md invariant 2).
 */
export function resolveJiraConfig(override: Partial<JiraConfig> = {}): JiraConfig {
    const baseUrl = (override.baseUrl || env('JIRA_BASE_URL')).replace(/\/+$/, '');
    const config: JiraConfig = {
        baseUrl,
        email: override.email || env('JIRA_EMAIL'),
        apiToken: override.apiToken || env('JIRA_API_TOKEN'),
        projectKey: override.projectKey || env('JIRA_PROJECT_KEY') || undefined,
        acField: override.acField || env('JIRA_AC_FIELD') || undefined,
    };

    const missing = (['baseUrl', 'email', 'apiToken'] as const).filter((k) => !config[k]);
    if (missing.length) {
        throw Object.assign(
            new Error(
                `Jira is not configured. Missing: ${missing.join(', ')}. ` +
                `Set JIRA_BASE_URL / JIRA_EMAIL / JIRA_API_TOKEN in .env, or supply them from Connections.`
            ),
            { status: 400 }
        );
    }
    if (!/^https?:\/\//i.test(config.baseUrl)) {
        throw Object.assign(
            new Error(`The Jira site URL must start with http(s)://, got "${config.baseUrl}"`),
            { status: 400 }
        );
    }
    return config;
}

const API_KEY_BY_PROVIDER: Record<string, string> = {
    groq: 'GROQ_API_KEY',
    xai: 'XAI_API_KEY',
    openai: 'OPENAI_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
};

/**
 * Only used when the caller names a provider but no model. Deliberately short:
 * the Settings dropdown is populated live from the provider (findings.md §9), so
 * these are a floor, not a catalogue to maintain.
 */
const DEFAULT_MODEL_BY_PROVIDER: Record<LLMProvider, string> = {
    groq: 'openai/gpt-oss-120b',
    xai: 'grok-4',
    openai: 'gpt-4o',
    claude: 'claude-sonnet-5',
    gemini: 'gemini-2.0-flash',
    ollama: 'llama3.2:3b',
};

export const SUPPORTED_PROVIDERS = Object.keys(DEFAULT_MODEL_BY_PROVIDER) as LLMProvider[];

/** Providers that cannot realistically finish a plan inside a serverless request. */
export const LOCAL_ONLY_PROVIDERS: LLMProvider[] = ['ollama'];

export function resolveLLMConfig(override: Partial<LLMConfig> = {}): LLMConfig {
    const envProvider = env('LLM_PROVIDER', 'groq').toLowerCase();
    const provider = (override.provider || envProvider).toLowerCase() as LLMProvider;

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
        throw Object.assign(
            new Error(`Unsupported LLM provider "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}`),
            { status: 400 }
        );
    }

    // LLM_MODEL names a model for LLM_PROVIDER. Applying it to a different
    // provider would send, say, a Groq model id to Anthropic.
    const envModel = provider === envProvider ? env('LLM_MODEL') : '';
    const model = override.model || envModel || DEFAULT_MODEL_BY_PROVIDER[provider];
    const apiKey = override.apiKey || env(API_KEY_BY_PROVIDER[provider] ?? '');

    if (provider !== 'ollama' && !apiKey) {
        throw Object.assign(
            new Error(
                `No API key for provider "${provider}". ` +
                `Set ${API_KEY_BY_PROVIDER[provider] ?? 'the provider API key'} in .env, or supply it from Settings.`
            ),
            { status: 400 }
        );
    }

    return {
        provider,
        model,
        apiKey,
        endpoint: override.endpoint || env('OLLAMA_ENDPOINT', 'http://localhost:11434/api/chat'),
    };
}

/** Which credentials are present, for Settings and Connections. Never returns key material. */
export function configStatus() {
    return {
        jira: {
            baseUrl: env('JIRA_BASE_URL'),
            email: env('JIRA_EMAIL'),
            projectKey: env('JIRA_PROJECT_KEY'),
            hasToken: Boolean(env('JIRA_API_TOKEN')),
            acField: env('JIRA_AC_FIELD'),
        },
        llm: {
            provider: env('LLM_PROVIDER', 'groq'),
            model: env('LLM_MODEL'),
            providers: SUPPORTED_PROVIDERS,
            localOnly: LOCAL_ONLY_PROVIDERS,
            configured: Object.fromEntries(
                SUPPORTED_PROVIDERS.map((p) => [
                    p,
                    p === 'ollama' ? true : Boolean(env(API_KEY_BY_PROVIDER[p] ?? '')),
                ])
            ),
        },
        deployment: {
            /** Serverless kills a function at 60s; the UI warns before a slow model is chosen. */
            serverless: Boolean(process.env.VERCEL),
        },
    };
}
