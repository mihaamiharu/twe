/* eslint-disable security/detect-non-literal-fs-filename -- Explicit recovery paths and this process's private temporary directory. */
import { createHash } from 'node:crypto';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { assertPrivatePath } from './migration/model';
import { readJsonConfig } from './json-config';
import {
  assertProductionBackupReady,
  backupKeyId,
  backupTargetSchema,
  decryptBackup,
  encryptBackup,
  parseBackupKey,
  resolveBackupTarget,
} from './backup/model';

async function main() {
  const [mode, targetOrInput, output] = process.argv.slice(2);
  if (!targetOrInput || !output)
    throw new Error(
      'Use backup <preview|production> output.enc or decrypt input.enc /private/output.sql.',
    );
  const key = parseBackupKey(process.env['TWE_BACKUP_KEY']);
  const keyId = backupKeyId(key);
  if (
    process.env['TWE_BACKUP_KEY_ID'] &&
    process.env['TWE_BACKUP_KEY_ID'] !== keyId
  )
    throw new Error('Configured recovery key ID does not match the key.');
  if (mode === 'decrypt') {
    assertPrivatePath(output);
    const plain = decryptBackup(
      JSON.parse(await readFile(targetOrInput, 'utf8')) as unknown,
      key,
    );
    await writeFile(output, plain, { mode: 0o600, flag: 'wx' });
    console.log('Authenticated SQL written to the restricted recovery path.');
    return;
  }
  if (mode !== 'backup') throw new Error('Unknown backup operation.');
  const target = backupTargetSchema.parse(targetOrInput);
  if (
    process.env['TWE_BACKUP_KEY_TARGET'] &&
    process.env['TWE_BACKUP_KEY_TARGET'] !== target
  )
    throw new Error(
      'Recovery key record belongs to a different backup target.',
    );
  const resource = resolveBackupTarget(
    await readJsonConfig('wrangler.jsonc'),
    target,
  );
  if (
    process.env['CLOUDFLARE_ACCOUNT_ID'] &&
    process.env['CLOUDFLARE_ACCOUNT_ID'] !== resource.accountId
  )
    throw new Error(
      'Cloudflare account does not match the configured backup target.',
    );
  assertProductionBackupReady(
    target,
    resource.databaseId,
    process.env['TWE_PRODUCTION_BACKUP_READY'],
  );
  const git = Bun.spawn(['git', 'rev-parse', 'HEAD'], {
    stdout: 'pipe',
    stderr: 'ignore',
  });
  const sourceCommit = (await new Response(git.stdout).text()).trim();
  if ((await git.exited) !== 0 || !/^[a-f0-9]{40}$/.test(sourceCommit))
    throw new Error('Cannot identify backup source revision.');
  if (
    process.env['TWE_BACKUP_SOURCE_SHA'] &&
    process.env['TWE_BACKUP_SOURCE_SHA'] !== sourceCommit
  )
    throw new Error('Backup code does not match the approved source revision.');
  const directory = await mkdtemp(join(tmpdir(), 'twe-d1-backup-'));
  await chmod(directory, 0o700);
  try {
    const plainPath = join(directory, 'database.sql');
    const childEnvironment = { ...process.env };
    delete childEnvironment['TWE_BACKUP_KEY'];
    const child = Bun.spawn(
      [
        process.execPath,
        '--no-env-file',
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
      {
        env: childEnvironment,
        stdout: 'ignore',
        stderr: 'ignore',
      },
    );
    if ((await child.exited) !== 0) throw new Error('D1 export failed.');
    const sql = await readFile(plainPath);
    if (!sql.byteLength) throw new Error('D1 export was empty.');
    const envelope = encryptBackup(sql, key, {
      target,
      databaseId: resource.databaseId,
      sourceCommit,
      keyId,
      createdAt: new Date().toISOString(),
    });
    const encrypted = JSON.stringify(envelope);
    const maximumBytes = Number(
      process.env['TWE_BACKUP_MAX_BYTES'] ?? 4 * 1024 * 1024,
    );
    if (
      !Number.isSafeInteger(maximumBytes) ||
      maximumBytes < 1024 ||
      Buffer.byteLength(encrypted) > maximumBytes
    )
      throw new Error(
        'Encrypted archive exceeds the configured artifact budget.',
      );
    const sha256 = createHash('sha256').update(encrypted).digest('hex');
    await writeFile(output, encrypted, { mode: 0o600, flag: 'wx' });
    await writeFile(
      `${output}.sha256`,
      `${sha256}  ${basename(output)}
`,
      { mode: 0o600, flag: 'wx' },
    );
    await writeFile(
      `${output}.manifest.json`,
      JSON.stringify(
        {
          ...resource,
          sourceCommit,
          keyId,
          createdAt: envelope.createdAt,
          encryptedBytes: Buffer.byteLength(encrypted),
          sha256,
        },
        null,
        2,
      ),
      { mode: 0o600, flag: 'wx' },
    );
    console.log(
      JSON.stringify({
        event: 'encrypted_d1_backup_created',
        target,
        databaseId: resource.databaseId,
        keyId,
        sourceCommit,
        encryptedBytes: Buffer.byteLength(encrypted),
        sha256,
      }),
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
try {
  await main();
} catch {
  console.error(
    'D1 backup/recovery failed. Check credentials, key ID, target readiness, approved revision and artifact size; no SQL or secret values are logged.',
  );
  process.exitCode = 1;
}
