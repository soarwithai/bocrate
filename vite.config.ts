import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      base: 'https://soarwithai.github.io/bocrate/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // No runtime API keys required for this static rate viewer
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
