/* eslint-disable security/detect-non-literal-fs-filename -- The exclusive temporary config stays beside the operator-selected source and is always removed. */
import { writeFile, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { z } from 'zod';
import { readJsonConfig } from './json-config';

/** CLI data tools need D1/vars, not a fake instance of the application's DO. */
export async function getDataPlatformProxy<Env>(
  options: NonNullable<Parameters<typeof getPlatformProxy>[0]>,
) {
  const source = resolve(options.configPath ?? 'wrangler.jsonc');
  const config = z
    .record(z.string(), z.unknown())
    .parse(await readJsonConfig(source));
  const dataConfig = Object.fromEntries(
    Object.entries(config).filter(
      ([name]) => !['durable_objects', 'migrations'].includes(name),
    ),
  );
  // Same directory preserves relative bindings and .dev.vars lookup. Never
  // modify the source or copy resolved secrets into a generated configuration.
  const temporary = join(
    dirname(source),
    `.${basename(source)}.data-proxy-${crypto.randomUUID()}.json`,
  );
  await writeFile(temporary, JSON.stringify(dataConfig), {
    mode: 0o600,
    flag: 'wx',
  });
  try {
    return await getPlatformProxy<Env>({ ...options, configPath: temporary });
  } finally {
    await rm(temporary);
  }
}
