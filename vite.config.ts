import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { contentManifestPlugin } from './scripts/content-manifest.plugin';
import { ogAssetsPlugin } from './scripts/og-assets.plugin';
import { bundleAuditPlugin } from './scripts/bundle-audit.plugin';

const config = defineConfig({
  plugins: [
    contentManifestPlugin(),
    ogAssetsPlugin(),
    cloudflare({
      configPath: process.env['TWE_WRANGLER_CONFIG'] || 'wrangler.jsonc',
      persistState: {
        path: process.env['TWE_D1_PERSIST'] || '.wrangler/state',
      },
      viteEnvironment: { name: 'ssr' },
      remoteBindings: false,
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({ server: { entry: './server.ts' } }),
    viteReact(),
    bundleAuditPlugin(),
  ],
  optimizeDeps: {
    exclude: ['@resvg/resvg-js'],
  },
});

export default config;
