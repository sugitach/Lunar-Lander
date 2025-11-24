// vite.config.ts
import { defineConfig } from 'vitest/config';


export default defineConfig({
    // No need for plugins in this vanilla-ts project, but keep placeholder
    plugins: [],
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html']
        }
    }
});
