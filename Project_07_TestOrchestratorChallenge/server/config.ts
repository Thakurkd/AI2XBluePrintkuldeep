import dotenv from 'dotenv';

// Loads .env from the project root for local dev. On Vercel there is no .env
// file and no __dirname (ESM), so the platform's environment is used as-is.
dotenv.config();

export interface JiraConfig {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey?: string;
}

export interface LLMConfig {
    provider: string;
    model: string;
    apiKey?: string;
    endpoint?: string;
}

const env = (key: string, fallback = '') => (process.env[key] ?? fallback).trim();

export const PORT = Number(env('PORT', '5007'));

/**
 * Secrets live in .env on the server. The frontend may send partial overrides
 * (say, a different project key) without ever holding the tokens itself, so
 * anything the request omits falls back to the environment.
 */
export function resolveJiraConfig(override: Partial<JiraConfig> = {}): JiraConfig {
    const baseUrl = (override.baseUrl || env('JIRA_BASE_URL')).replace(/\/+$/, '');
    const config: JiraConfig = {
        baseUrl,
        email: override.email || env('JIRA_EMAIL'),
        apiToken: override.apiToken || env('JIRA_API_TOKEN'),
        projectKey: override.projectKey || env('JIRA_PROJECT_KEY') || undefined,
    };

    const missing = (['baseUrl', 'email', 'apiToken'] as const).filter((k) => !config[k]);
    if (missing.length) {
        throw new Error(
            `Jira is not configured. Missing: ${missing.join(', ')}. ` +
            `Set JIRA_BASE_URL / JIRA_EMAIL / JIRA_API_TOKEN in backend/.env, or supply them from Settings.`
        );
    }
    if (!/^https?:\/\//i.test(config.baseUrl)) {
        throw new Error(`JIRA_BASE_URL must start with http(s)://, got "${config.baseUrl}"`);
    }
    return config;
}

const API_KEY_BY_PROVIDER: Record<string, string> = {
    groq: 'GROQ_API_KEY',
    openai: 'OPENAI_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
};

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
    groq: 'llama-3.3-70b-versatile',
    openai: 'gpt-4o',
    claude: 'claude-sonnet-5',
    gemini: 'gemini-2.0-flash',
    ollama: 'llama3.2:3b',
};

export function resolveLLMConfig(override: Partial<LLMConfig> = {}): LLMConfig {
    const envProvider = env('LLM_PROVIDER', 'groq').toLowerCase();
    const provider = (override.provider || envProvider).toLowerCase();

    // LLM_MODEL names a model for LLM_PROVIDER. Applying it to a different
    // provider would send, say, a Groq model id to Anthropic.
    const envModel = provider === envProvider ? env('LLM_MODEL') : '';
    const model = override.model || envModel || DEFAULT_MODEL_BY_PROVIDER[provider] || '';
    const apiKey = override.apiKey || env(API_KEY_BY_PROVIDER[provider] ?? '');

    if (provider !== 'ollama' && !apiKey) {
        throw new Error(
            `No API key for provider "${provider}". ` +
            `Set ${API_KEY_BY_PROVIDER[provider] ?? 'the provider API key'} in backend/.env, or supply it from Settings.`
        );
    }
    return {
        provider,
        model,
        apiKey,
        endpoint: override.endpoint || env('OLLAMA_ENDPOINT', 'http://localhost:11434/api/chat'),
    };
}

/** Which providers/creds are present, for the Settings screen. Never returns key material. */
export function configStatus() {
    return {
        jira: {
            baseUrl: env('JIRA_BASE_URL'),
            email: env('JIRA_EMAIL'),
            projectKey: env('JIRA_PROJECT_KEY'),
            hasToken: Boolean(env('JIRA_API_TOKEN')),
        },
        llm: {
            provider: env('LLM_PROVIDER', 'groq'),
            model: env('LLM_MODEL'),
            configured: Object.fromEntries(
                Object.entries(API_KEY_BY_PROVIDER).map(([p, k]) => [p, Boolean(env(k))])
            ),
        },
    };
}
