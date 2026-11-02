/* eslint-disable security/detect-non-literal-fs-filename -- Operator secret paths are resolved outside the checkout and required to be private regular files. */
import { readJsonConfig } from './json-config';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { z } from 'zod';

const target = z.enum(['preview', 'production']).parse(process.argv[2]);
const secretFileArgument = process.argv[3];
let secretFile: string | undefined;
let suppliedSecrets: Record<string, string> = {};
if (secretFileArgument) {
  if (!isAbsolute(secretFileArgument))
    throw new Error(
      'Deployment secret files must use an absolute private path.',
    );
  const metadata = await lstat(secretFileArgument);
  secretFile = await realpath(secretFileArgument);
  const location = relative(await realpath(process.cwd()), secretFile);
  if (
    !metadata.isFile() ||
    (metadata.mode & 0o077) !== 0 ||
    (!location.startsWith(`..${sep}`) && !isAbsolute(location))
  )
    throw new Error(
      'Deployment secret files must be private regular files outside the checkout.',
    );
  let value: unknown;
  try {
    value = JSON.parse(await readFile(secretFile, 'utf8')) as unknown;
  } catch {
    throw new Error('Deployment secret file must contain a JSON object.');
  }
  const parsed = z
    .record(z.string().regex(/^[A-Z][A-Z0-9_]*$/), z.string().min(1))
    .safeParse(value);
  if (!parsed.success || Object.keys(parsed.data).length === 0)
    throw new Error(
      'Deployment secret file must contain nonempty string settings.',
    );
  suppliedSecrets = parsed.data;
}
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
      EMAIL_PROVIDER: z
        .enum(['smtp', 'http', 'resend', 'unconfigured'])
        .optional(),
      EMAIL_HTTP_URL: z.string().url().optional(),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: z.string().optional(),
    }),
    d1_databases: z.array(bindingSchema),
    durable_objects: z.object({
      bindings: z.array(z.object({ name: z.string(), class_name: z.string() })),
    }),
    migrations: z.array(
      z.object({ new_sqlite_classes: z.array(z.string()).optional() }),
    ),
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
  !config.durable_objects.bindings.some(
    (binding) =>
      binding.name === 'APP_RUNTIME' && binding.class_name === 'AppRuntime',
  ) ||
  !config.migrations.some((migration) =>
    migration.new_sqlite_classes?.includes('AppRuntime'),
  ) ||
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
    !['smtp', 'http', 'resend'].includes(config.vars.EMAIL_PROVIDER ?? '') ||
    (config.vars.EMAIL_PROVIDER === 'http' &&
      !config.vars.EMAIL_HTTP_URL?.startsWith('https://')) ||
    (config.vars.EMAIL_PROVIDER === 'smtp' &&
      (!config.vars.SMTP_HOST || config.vars.SMTP_PORT !== '465'))
  )
    throw new Error(
      'Select/configure the email transport before production deployment.',
    );
}
const required =
  target === 'preview'
    ? ['BETTER_AUTH_SECRET', 'PREVIEW_ACCESS_TOKEN']
    : [
        'BETTER_AUTH_SECRET',
        'EMAIL_FROM',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'DEEPSEEK_API_KEY',
        'AI_HINT_DAILY_LIMIT',
        'GH_API_TOKEN',
        'GH_OWNER',
        'GH_REPO',
        'ADMIN_EMAIL',
      ];
if (['smtp', 'http', 'resend'].includes(config.vars.EMAIL_PROVIDER ?? '')) {
  required.push('EMAIL_FROM');
  if (config.vars.EMAIL_PROVIDER === 'smtp')
    required.push('SMTP_USER', 'SMTP_PASSWORD');
  else required.push('EMAIL_API_KEY');
}
const secretNames = new Set(Object.keys(suppliedSecrets));
// A new Worker has no remote secrets to inspect. Wrangler can atomically upload
// its code and a complete secret file; existing deployments can still inherit
// required secrets not supplied in a partial update.
if (required.some((name) => !secretNames.has(name))) {
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
    throw new Error(
      'Cannot inspect required Worker secret names; first deployment requires a complete private secret file.',
    );
  const existing = z
    .array(z.object({ name: z.string() }))
    .parse(JSON.parse(rawNames) as unknown);
  for (const secret of existing) secretNames.add(secret.name);
}
const missing = required.filter((name) => !secretNames.has(name));
if (missing.length)
  throw new Error(
    `Required ${target} secret names are missing: ${missing.join(', ')}.`,
  );
const child = Bun.spawn(
  [
    process.execPath,
    'x',
    'wrangler',
    'deploy',
    ...(secretFile ? ['--secrets-file', secretFile] : []),
  ],
  {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
);
process.exitCode = await child.exited;
