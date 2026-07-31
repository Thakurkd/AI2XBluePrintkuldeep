/**
 * Shared plumbing for the Phase 2 "Link" handshakes.
 *
 * These scripts exist to prove a wire works before any logic is built on it, so
 * they deliberately do not import the application's config layer — a handshake
 * that depends on the code it is meant to validate proves nothing.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

export const env = (key: string, fallback = '') => (process.env[key] ?? fallback).trim();

/** Read a required variable, or exit with the name of the one that is missing. */
export function required(key: string): string {
    const value = env(key);
    if (!value) {
        fail(`${key} is not set in .env`);
    }
    return value;
}

/** `--provider groq` / `--key SCRUM-1` → { provider: 'groq', key: 'SCRUM-1' } */
export function args(): Record<string, string> {
    const out: Record<string, string> = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;
        const name = token.replace(/^--/, '');
        const next = argv[i + 1];
        out[name] = next && !next.startsWith('--') ? (i++, next) : 'true';
    }
    return out;
}

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

export function heading(text: string): void {
    console.log(`\n${bold(text)}\n${dim('─'.repeat(Math.max(text.length, 40)))}`);
}

export function line(label: string, value: unknown): void {
    console.log(`  ${label.padEnd(22)} ${value}`);
}

export function pass(text: string): void {
    console.log(`\n${green('PASS')}  ${text}\n`);
}

/** A failed handshake must exit non-zero — `npm run link:all` has to stop here. */
export function fail(text: string): never {
    console.error(`\n${red('FAIL')}  ${text}\n`);
    process.exit(1);
}

/** Turn an axios error into the sentence a human needs, not a stack trace. */
export function explain(error: any, context: string): string {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const jiraMessages = Array.isArray(data?.errorMessages) ? data.errorMessages.join('; ') : '';
    const detail =
        jiraMessages ||
        data?.error?.message ||
        (typeof data?.error === 'string' ? data.error : '') ||
        data?.message ||
        error?.message ||
        'unknown error';

    if (status === 401) return `${context}: credentials rejected (401). ${detail}`;
    if (status === 403) return `${context}: access denied (403) — the account lacks permission. ${detail}`;
    if (status === 404) return `${context}: not found (404) — check the base URL and the id. ${detail}`;
    if (status === 429) return `${context}: rate limited (429). ${detail}`;
    if (error?.code === 'ECONNREFUSED') return `${context}: connection refused — is the service running?`;
    if (error?.code === 'ENOTFOUND') return `${context}: host not found — check the URL.`;
    if (error?.code === 'ECONNABORTED') return `${context}: timed out.`;
    return `${context}: ${status ? `HTTP ${status} — ` : ''}${detail}`;
}
