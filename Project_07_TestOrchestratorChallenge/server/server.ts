import { PORT } from './config.js';
import { createApp } from './app.js';

// Local development entry point. On Vercel the app is served by api/index.ts
// as a serverless function instead, with no long-lived listener.
createApp().listen(PORT, () => {
    console.log(`Test Orchestrator API listening on http://localhost:${PORT}`);
});
