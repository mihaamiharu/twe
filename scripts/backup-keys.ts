/* eslint-disable security/detect-non-literal-fs-filename -- Exclusive private recovery records selected by the owner. */
import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { z } from 'zod';
import { assertPrivatePath } from './migration/model';
import { readJsonConfig } from './json-config';
import {
  backupKeyId,
  backupTargetSchema,
  parseBackupKey,
  resolveBackupTarget,
} from './backup/model';

const recordSchema = z.object({
  format: z.literal('twe-recovery-keychain-v1'),
  target: backupTargetSchema,
  accountId: z.string(),
  databaseId: z.string().uuid(),
  keyId: z.string(),
  service: z.string().regex(/^com\.testingwithekki\.d1-backup\.[a-z0-9.-]+$/),
  account: z.string().regex(/^[a-z0-9-]+$/),
  createdAt: z.string(),
});
const loginKeychain = join(homedir(), 'Library/Keychains/login.keychain-db');

async function keychainRead(service: string, account: string): Promise<string> {
  const child = Bun.spawn(
    [
      '/usr/bin/security',
      'find-generic-password',
      '-s',
      service,
      '-a',
      account,
      '-w',
      loginKeychain,
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );
  const [value] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if ((await child.exited) !== 0)
    throw new Error('Recovery key is unavailable in the owner Keychain.');
  return value.trim();
}

async function main() {
  const [mode, path, ...args] = process.argv.slice(2);
  if (!path)
    throw new Error('Specify an absolute private recovery-record path.');
  assertPrivatePath(path);
  if (process.platform !== 'darwin')
    throw new Error('The owner Keychain helper requires macOS.');
  if (mode === 'init') {
    const target = backupTargetSchema.parse(args[0]);
    if (await Bun.file(path).exists())
      throw new Error(
        'Recovery record exists; never overwrite a retained key.',
      );
    const resource = resolveBackupTarget(
      await readJsonConfig('wrangler.jsonc'),
      target,
    );
    const key = randomBytes(32);
    const keyId = backupKeyId(key);
    const service = `com.testingwithekki.d1-backup.${target}.${keyId.slice(7, 23)}`;
    const account = resource.databaseId;
    const text = key.toString('base64');
    // The secret travels through stdin, never process arguments or shell history.
    // No -A (all-application access) or -U (overwrite existing item).
    const child = Bun.spawn(['/usr/bin/security', '-i'], {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const quotedPath = `"${loginKeychain.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
    child.stdin.write(
      `add-generic-password -a ${account} -s ${service} -w ${text} ${quotedPath}\n`,
    );
    await child.stdin.end();
    await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    if (
      backupKeyId(parseBackupKey(await keychainRead(service, account))) !==
      keyId
    )
      throw new Error('Keychain readback verification failed.');
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await chmod(dirname(path), 0o700);
    await writeFile(
      path,
      JSON.stringify(
        {
          format: 'twe-recovery-keychain-v1',
          ...resource,
          keyId,
          service,
          account,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      { mode: 0o600, flag: 'wx' },
    );
    console.log(
      JSON.stringify({
        target,
        keyId,
        independentKeychainReadbackVerified: true,
        recoveryRecordContainsKey: false,
      }),
    );
    return;
  }
  const record = recordSchema.parse(
    JSON.parse(await readFile(path, 'utf8')) as unknown,
  );
  const keyText = await keychainRead(record.service, record.account);
  if (backupKeyId(parseBackupKey(keyText)) !== record.keyId)
    throw new Error('Recovery record/key mismatch.');
  if (mode === 'status') {
    console.log(
      JSON.stringify({
        target: record.target,
        databaseId: record.databaseId,
        keyId: record.keyId,
        independentKeychainReadbackVerified: true,
      }),
    );
  } else if (mode === 'run') {
    const command = args.filter((item, index) => index !== 0 || item !== '--');
    if (!command.length)
      throw new Error('Specify the backup or recovery command.');
    const child = Bun.spawn(command, {
      env: {
        ...process.env,
        TWE_BACKUP_KEY: keyText,
        TWE_BACKUP_KEY_ID: record.keyId,
        TWE_BACKUP_KEY_TARGET: record.target,
      },
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
    process.exitCode = await child.exited;
  } else throw new Error('Use init, status or run.');
}
try {
  await main();
} catch {
  console.error(
    'Recovery-key operation failed. Check the private record, target and unlocked login Keychain; no key values are logged.',
  );
  process.exitCode = 1;
}
