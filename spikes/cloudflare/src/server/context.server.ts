import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { z } from 'zod';
import * as schema from '../db/schema';

const configuration = z.object({
  DEPLOYMENT_ENV: z.enum(['local', 'preview']),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export function getPreviewContext() {
  const config = configuration.parse({
    DEPLOYMENT_ENV: env.DEPLOYMENT_ENV,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
  });
  const hostname = new URL(config.BETTER_AUTH_URL).hostname;
  if (
    hostname !== 'localhost' && hostname !== '127.0.0.1' &&
    hostname !== 'twe-migration-preview.ekkisyam2310.workers.dev'
  ) {
    throw new Error('The spike must use its isolated local or preview origin.');
  }
  return { bindings: env, config, db: drizzle(env.DB, { schema }) };
}

export type PreviewContext = ReturnType<typeof getPreviewContext>;
