import { CodeLanguage, Framework } from '../types.js';

/**
 * Playwright type names that models routinely annotate with but forget to
 * import, leaving a file that looks right and fails to compile.
 */
const PLAYWRIGHT_TYPES = ['Page', 'Locator', 'BrowserContext', 'APIRequestContext', 'FrameLocator'];

const IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*['"]@playwright\/test['"]\s*;?/;

function repairPlaywrightTsImports(code: string): string {
    const match = code.match(IMPORT_RE);
    if (!match) return code;

    const existing = match[1]
        .split(',')
        .map((s) => s.trim().replace(/^type\s+/, ''))
        .filter(Boolean);

    // Only add a type the file actually annotates with, so we never import noise.
    const missing = PLAYWRIGHT_TYPES.filter((type) => {
        if (existing.includes(type)) return false;
        const annotated = new RegExp(`(?::\\s*|<\\s*)${type}\\b`);
        return annotated.test(code);
    });

    if (!missing.length) return code;

    const merged = [...existing, ...missing];
    return code.replace(IMPORT_RE, `import { ${merged.join(', ')} } from '@playwright/test';`);
}

const RELATIVE_IMPORT_RE = /^\s*import\s*\{([^}]*)\}\s*from\s*['"]\.[^'"]*['"]\s*;?\s*$/;

/**
 * Models are asked for one self-contained file, then import the page object
 * from a sibling path anyway - while also defining it inline. That is a
 * duplicate-identifier compile error, so drop the redundant import.
 */
function dropSelfImports(code: string): string {
    const declared = new Set(
        [...code.matchAll(/^\s*(?:export\s+)?(?:abstract\s+)?(?:class|const|function|let|var)\s+([A-Za-z_$][\w$]*)/gm)]
            .map((m) => m[1])
    );
    if (!declared.size) return code;

    return code
        .split('\n')
        .filter((line) => {
            const match = line.match(RELATIVE_IMPORT_RE);
            if (!match) return true;
            const names = match[1].split(',').map((n) => n.trim().replace(/^type\s+/, '')).filter(Boolean);
            // Only drop it when every imported name is already defined here.
            return !(names.length && names.every((n) => declared.has(n)));
        })
        .join('\n');
}

/**
 * Deterministic cleanup of the mistakes models make often enough that prompting
 * alone does not stop them. Everything here must be a no-op on correct code.
 */
export function repairGeneratedCode(
    code: string,
    framework: Framework,
    language: CodeLanguage
): string {
    if (!['typescript', 'javascript'].includes(language)) return code;

    let repaired = dropSelfImports(code);
    if (framework === 'playwright' && language === 'typescript') {
        repaired = repairPlaywrightTsImports(repaired);
    }
    return repaired;
}
