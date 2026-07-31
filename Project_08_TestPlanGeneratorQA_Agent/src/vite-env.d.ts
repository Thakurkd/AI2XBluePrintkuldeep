/// <reference types="vite/client" />

/** The default template ships with the app and is imported as raw text. */
declare module '*.md?raw' {
    const content: string;
    export default content;
}
