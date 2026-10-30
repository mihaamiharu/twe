import { readJsonConfig } from '../json-config';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { z } from 'zod';
import type { RuntimeEnv } from '../../src/runtime/env';
import { cellSchema } from './model';

export interface Query {
  sql: string;
  params?: z.infer<typeof cellSchema>[];
}
const responseSchema = z.object({
  success: z.literal(true),
  result: z.array(
    z.object({
      success: z.literal(true),
      results: z.array(z.record(z.string(), z.unknown())).optional(),
      meta: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

export async function createD1Client(
  target: 'local' | 'preview' | 'production',
) {
  if (target === 'local') {
    const platform = await getPlatformProxy<RuntimeEnv>({
      configPath: process.env['TWE_WRANGLER_CONFIG'] || 'wrangler.jsonc',
      remoteBindings: false,
      envFiles: [],
      persist: {
        path: process.env['TWE_D1_PERSIST']
          ? join(process.env['TWE_D1_PERSIST'], 'v3')
          : '.wrangler/state/v3',
      },
    });
    return {
      async run(queries: Query[]) {
        const result = await platform.env.DB.batch<Record<string, unknown>>(
          queries.map((query) =>
            platform.env.DB.prepare(query.sql).bind(...(query.params ?? [])),
          ),
        );
        return result.map((item) => item.results);
      },
      dispose: () => platform.dispose(),
    };
  }
  const config = await readJsonConfig('wrangler.jsonc');
  const parsed = z
    .object({
      env: z.record(
        z.string(),
        z.object({
          d1_databases: z.array(
            z.object({
              binding: z.string(),
              database_id: z.string().uuid(),
              database_name: z.string(),
            }),
          ),
        }),
      ),
    })
    .parse(config);
  // eslint-disable-next-line security/detect-object-injection -- target is a validated local/preview/production enum.
  const database = parsed.env[target]?.d1_databases.find(
    (binding) => binding.binding === 'DB',
  );
  if (!database || database.database_name !== `twe-${target}`)
    throw new Error('Unexpected D1 migration target.');
  if (
    target === 'production' &&
    process.env['TWE_CONFIRM_PRODUCTION_IMPORT'] !== database.database_id
  )
    throw new Error(
      'Production data access requires TWE_CONFIRM_PRODUCTION_IMPORT set to the configured target UUID.',
    );
  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID'];
  const apiToken = process.env['CLOUDFLARE_API_TOKEN'];
  if (!accountId || !/^[a-f0-9]{32}$/.test(accountId) || !apiToken)
    throw new Error(
      'Scoped Cloudflare account/token credentials are required for remote data migration.',
    );
  return {
    async run(queries: Query[]) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${database.database_id}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batch: queries }),
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(
          `D1 API request failed (${response.status}); recreate the isolated target before restarting an interrupted import.`,
        );
      }
      const value: unknown = await response.json();
      const result = responseSchema.safeParse(value);
      if (!result.success)
        throw new Error(
          'D1 reported a query failure; no row contents are included in diagnostics.',
        );
      return result.data.result.map((item) => item.results ?? []);
    },
    async dispose() {},
  };
}
