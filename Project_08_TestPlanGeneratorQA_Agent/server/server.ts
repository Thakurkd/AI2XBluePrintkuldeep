import { createApp } from './app.js';
import { PORT } from './config.js';

createApp().listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}  ·  frontend proxies /api here`);
});
