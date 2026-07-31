/** Vercel entry point: the same Express app, as a serverless function. */
import { createApp } from '../server/app.js';

export default createApp();
