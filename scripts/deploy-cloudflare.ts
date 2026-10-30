import { readJsonConfig } from './json-config';
import { resolve } from 'node:path';
import { z } from 'zod';

const target = z.enum(['preview', 'production']).parse(process.argv[2]);
const redirect = await readJsonConfig('.wrangler/deploy/config.json');
const location = z.object({ configPath: z.string() }).parse(redirect);
const bindingSchema = z.object({
  binding: z.string(),
  database_id: z.string().uuid(),
  database_name: z.string(),
});
const built = await readJsonConfig(
  resolve('.wrangler/deploy', location.configPath),
);
const config = z
  .object({
    name: z.string(),
    vars: z.object({
      APP_ENV: z.string(),
      EMAIL_PROVIDER: z.enum(['http', 'resend', 'unconfigured']).optional(),
      EMAIL_HTTP_URL: z.string().url().optional(),
    }),
    d1_databases: z.array(bindingSchema),
  })
  .parse(built);
const source = z
  .object({
    env: z.record(
      z.string(),
      z.object({ d1_databases: z.array(bindingSchema) }),
    ),
  })
  .parse(await readJsonConfig('wrangler.jsonc'));
// eslint-disable-next-line security/detect-object-injection -- target is a validated two-value environment enum.
const expectedId = source.env[target]?.d1_databases.find(
  (binding) => binding.binding === 'DB',
)?.database_id;
if (
  config.name !== `twe-${target}` ||
  config.vars.APP_ENV !== target ||
  !config.d1_databases.some(
    (binding) =>
      binding.binding === 'DB' &&
      binding.database_name === `twe-${target}` &&
      binding.database_id === expectedId,
  )
)
  throw new Error(
    'The built artifact does not match the requested environment. Build it with CLOUDFLARE_ENV first.',
  );
if (target === 'production') {
  const git = Bun.spawn(['git', 'rev-parse', 'HEAD'], {
    stdout: 'pipe',
    stderr: 'ignore',
  });
  const revision = (await new Response(git.stdout).text()).trim();
  if (
    (await git.exited) !== 0 ||
    process.env['TWE_RELEASE_APPROVED_SHA'] !== revision ||
    process.env['TWE_ALLOW_PRODUCTION_DEPLOY'] !== 'yes'
  )
    throw new Error(
      'Production deploy requires the approved candidate SHA and explicit release authorization.',
    );
  if (
    !['http', 'resend'].includes(config.vars.EMAIL_PROVIDER ?? '') ||
    (config.vars.EMAIL_PROVIDER === 'http' &&
      !config.vars.EMAIL_HTTP_URL?.startsWith('https://'))
  )
    throw new Error(
      'Select/configure the email transport before production deployment.',
    );
}
const listed = Bun.spawn(
  [
    process.execPath,
    'x',
    'wrangler',
    'secret',
    'list',
    '--config',
    'wrangler.jsonc',
    '--env',
    target,
  ],
  { stdout: 'pipe', stderr: 'ignore' },
);
const rawNames = await new Response(listed.stdout).text();
if ((await listed.exited) !== 0)
  throw new Error('Cannot inspect required Worker secret names.');
const secretNames = new Set(
  z
    .array(z.object({ name: z.string() }))
    .parse(JSON.parse(rawNames) as unknown)
    .map((secret) => secret.name),
);
const required =
  target === 'preview'
    ? ['BETTER_AUTH_SECRET', 'PREVIEW_ACCESS_TOKEN']
    : [
        'BETTER_AUTH_SECRET',
        'EMAIL_API_KEY',
        'EMAIL_FROM',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'DEEPSEEK_API_KEY',
        'GH_API_TOKEN',
        'GH_OWNER',
        'GH_REPO',
        'ADMIN_EMAIL',
      ];
const missing = required.filter((name) => !secretNames.has(name));
if (missing.length)
  throw new Error(
    `Required ${target} secret names are missing: ${missing.join(', ')}.`,
  );
const child = Bun.spawn([process.execPath, 'x', 'wrangler', 'deploy'], {
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});
process.exitCode = await child.exited;
