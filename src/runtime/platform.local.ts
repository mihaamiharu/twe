import { getDataPlatformProxy } from '../../scripts/data-platform-proxy';
import { join } from 'node:path';
import type { RuntimeEnv } from './env';

// CLI/content scripts use the same local D1 store as Wrangler/Vite.
// The workerd package condition excludes this module from the Worker.
const platform = await getDataPlatformProxy<RuntimeEnv>({
  configPath: process.env['TWE_WRANGLER_CONFIG'] || 'wrangler.jsonc',
  persist: {
    path: process.env['TWE_D1_PERSIST']
      ? join(process.env['TWE_D1_PERSIST'], 'v3')
      : '.wrangler/state/v3',
  },
  envFiles: [],
  remoteBindings: false,
});

export function getRuntimeEnv(): RuntimeEnv {
  return platform.env;
}

export async function closeRuntime() {
  await platform.dispose();
}
