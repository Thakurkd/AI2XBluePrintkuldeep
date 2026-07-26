// Vercel serverless entry point. Every /api/* request is rewritten here by
// vercel.json, and Express matches the original path from there.
import { createApp } from '../server/app.js';

export default createApp();
