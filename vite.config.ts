import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { contentManifestPlugin } from './scripts/content-manifest.plugin';
import { ogAssetsPlugin } from './scripts/og-assets.plugin';
import { bundleAuditPlugin } from './scripts/bundle-audit.plugin';
import { satoriWorkerdPlugin } from './scripts/satori-workerd.plugin';

// Local Worker bindings come from explicit .dev.vars files. Legacy .env may
// still contain VPS credentials and must not become Cloudflare preview vars.
process.env['CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV'] = 'false';
process.env['CLOUDFLARE_INCLUDE_PROCESS_ENV'] = 'false';

const config = defineConfig({
  plugins: [
    contentManifestPlugin(),
    ogAssetsPlugin(),
    satoriWorkerdPlugin(),
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
