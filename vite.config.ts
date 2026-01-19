import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ isSsrBuild }) => {
  return {
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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Only use manualChunks for client-side dependencies
            if (isSsrBuild) {
              return undefined;
            }

            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@tanstack')) {
                return 'tanstack-vendor';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
            }
            return undefined;
          }
        },
      },
    },
  };
});
