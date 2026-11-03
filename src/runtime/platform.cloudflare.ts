import { env } from 'cloudflare:workers';
import type { RuntimeEnv } from './env';

export function getRuntimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export async function closeRuntime() {}
