import { z } from 'zod';

const selected = process.argv[2] || process.env['CLOUDFLARE_ENV'];
const target = selected
  ? z.enum(['preview', 'production']).parse(selected)
  : undefined;
const inherited = process.env['NODE_OPTIONS'] || '';
// Cloudflare's build toolchain plus the editor/compiler graph exceed Node's
// default 2 GiB heap. This is a local build budget, not a Worker runtime limit.
const nodeOptions = /--max[-_]old[-_]space[-_]size/.test(inherited)
  ? inherited
  : `${inherited} --max-old-space-size=4096`.trim();
const child = Bun.spawn([process.execPath, 'x', 'vite', 'build'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    NODE_OPTIONS: nodeOptions,
    // Legacy .env may contain production credentials. Build metadata must not
    // inherit them through Cloudflare's local-preview variable fallback.
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false',
    ...(target ? { CLOUDFLARE_ENV: target } : {}),
  },
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});
process.exitCode = await child.exited;
