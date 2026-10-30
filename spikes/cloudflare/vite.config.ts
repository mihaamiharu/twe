import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  envDir: import.meta.dirname,
  plugins: [
    cloudflare({
      configPath: `${import.meta.dirname}/wrangler.jsonc`,
      viteEnvironment: { name: 'ssr' },
      remoteBindings: false,
    }),
    tanstackStart(),
    react(),
  ],
});
