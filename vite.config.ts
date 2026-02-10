import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

const config = defineConfig({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  optimizeDeps: {
    exclude: ['@resvg/resvg-js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // TanStack libraries
          if (id.includes('node_modules/@tanstack/')) {
            return 'tanstack-vendor';
          }
          // UI libraries (Radix, Lucide)
          if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react/')) {
            return 'ui-vendor';
          }
        },
      },
    },
  },
});

export default config;
