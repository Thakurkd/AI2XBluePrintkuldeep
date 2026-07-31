import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    // The default template is imported with ?raw so the server never needs a
    // filesystem — see tools/plan/render.ts.
    assetsInclude: ['**/*.md'],
    server: {
        port: 5173,
        // Proxy keeps credentials server-side: the browser only ever talks to /api.
        proxy: {
            '/api': {
                target: 'http://localhost:5008',
                changeOrigin: true,
            },
        },
    },
});
