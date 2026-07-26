import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // Proxy keeps API keys server-side: the browser only ever talks to /api.
        proxy: {
            '/api': {
                target: 'http://localhost:5007',
                changeOrigin: true,
            },
        },
    },
});
