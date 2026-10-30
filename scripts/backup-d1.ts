/* eslint-disable security/detect-non-literal-fs-filename -- Offline backup paths are explicit operator inputs; plaintext output is restricted outside the repository. */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { assertPrivatePath } from './migration/model';

const [mode, targetOrInput, output] = process.argv.slice(2);
const keyText = process.env['TWE_BACKUP_KEY'];
const key = keyText ? Buffer.from(keyText, 'base64') : undefined;
if (!key || key.byteLength !== 32 || !output)
  throw new Error(
    'Use a separately stored 32-byte base64 TWE_BACKUP_KEY and an explicit output path.',
  );

if (mode === 'decrypt') {
  if (!targetOrInput) throw new Error('An encrypted backup path is required.');
  assertPrivatePath(output);
  const envelope = z
    .object({
      format: z.literal('twe-d1-aes256gcm-v1'),
      iv: z.string(),
      tag: z.string(),
      data: z.string(),
      target: z.string(),
      createdAt: z.string(),
    })
    .parse(JSON.parse(await readFile(targetOrInput, 'utf8')) as unknown);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAAD(
    Buffer.from(
      JSON.stringify({
        format: envelope.format,
        target: envelope.target,
        createdAt: envelope.createdAt,
      }),
    ),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]);
  await writeFile(output, plain, { mode: 0o600, flag: 'wx' });
  console.log('Decrypted SQL written to the restricted output path.');
} else if (mode === 'backup') {
  const target = z.enum(['preview', 'production']).parse(targetOrInput);
  const directory = await mkdtemp(join(tmpdir(), 'twe-d1-backup-'));
  await chmod(directory, 0o700);
  try {
    const plainPath = join(directory, 'database.sql');
    const child = Bun.spawn(
      [
        process.execPath,
        'x',
        'wrangler',
        'd1',
        'export',
        'DB',
        '--remote',
        '--env',
        target,
        '--config',
        'wrangler.jsonc',
        '--output',
        plainPath,
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    );
    if ((await child.exited) !== 0)
      throw new Error(
        'D1 export failed; no SQL contents are included in logs.',
      );
    // The IV is public; the random key must remain in a separate recovery store.
    const iv = randomBytes(12);
    const metadata = {
      format: 'twe-d1-aes256gcm-v1',
      target,
      createdAt: new Date().toISOString(),
    };
    const encryption = createCipheriv('aes-256-gcm', key, iv);
    encryption.setAAD(Buffer.from(JSON.stringify(metadata)));
    const data = Buffer.concat([
      encryption.update(await readFile(plainPath)),
      encryption.final(),
    ]);
    await writeFile(
      output,
      JSON.stringify({
        ...metadata,
        iv: iv.toString('base64'),
        tag: encryption.getAuthTag().toString('base64'),
        data: data.toString('base64'),
      }),
      { mode: 0o600, flag: 'wx' },
    );
    console.log(
      `Encrypted ${target} D1 backup written. Keep its key in a separate recovery store.`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
} else {
  throw new Error(
    'Usage: bun scripts/backup-d1.ts <backup preview|backup production|decrypt input.enc> output-path',
  );
}
