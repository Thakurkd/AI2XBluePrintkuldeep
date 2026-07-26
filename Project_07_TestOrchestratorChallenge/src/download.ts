/** Trigger a browser download for generated artifacts (plans, test cases, code). */
export function download(filename: string, contents: string, mime = 'text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([contents], { type: mime }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

const EXTENSION: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    java: 'java',
    python: 'py',
    csharp: 'cs',
};

/** SCRUM-1-TC-001 + playwright/typescript -> scrum-1-tc-001.spec.ts */
export function codeFilename(testCaseId: string, framework: string, language: string): string {
    const ext = EXTENSION[language] ?? 'txt';
    const base = testCaseId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const suffix = framework === 'playwright' && ['typescript', 'javascript'].includes(language)
        ? '.spec'
        : language === 'python'
          ? '_test'
          : 'Test';

    if (language === 'java' || language === 'csharp') {
        const pascal = testCaseId.replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase());
        return `${pascal.charAt(0).toUpperCase()}${pascal.slice(1)}${suffix}.${ext}`;
    }
    return `${base}${suffix === 'Test' ? '' : suffix}.${ext}`;
}
