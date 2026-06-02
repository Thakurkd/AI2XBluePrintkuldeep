async (page) => {
    return JSON.stringify({
        keys: Object.keys(globalThis),
        typeofWindow: typeof window,
        typeofProcess: typeof process,
        typeofDocument: typeof document,
        typeofPage: typeof page
    }, null, 2);
}
