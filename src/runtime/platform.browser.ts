import type { RuntimeEnv } from './env';

// The local CLI adapter imports Wrangler. Never pull that toolchain into the
// browser while Vite analyzes shared route modules before tree shaking them.
export function getRuntimeEnv(): RuntimeEnv {
  throw new Error('Server bindings are unavailable in the browser.');
}

export async function closeRuntime() {}
