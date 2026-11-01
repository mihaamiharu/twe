import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { z } from 'zod';

export const backupTargetSchema = z.enum(['preview', 'production']);
export type BackupTarget = z.infer<typeof backupTargetSchema>;
export const backupMetadataSchema = z.object({
  target: backupTargetSchema,
  databaseId: z.string().uuid(),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  keyId: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  createdAt: z.string().datetime(),
});
export type BackupMetadata = z.infer<typeof backupMetadataSchema>;

export function parseBackupKey(value: string | undefined): Buffer {
  const text = value?.trim() ?? '';
  const key = Buffer.from(text, 'base64');
  if (key.byteLength !== 32 || key.toString('base64') !== text)
    throw new Error('A canonical 32-byte base64 recovery key is required.');
  return key;
}

export function backupKeyId(key: Uint8Array): string {
  return `sha256:${createHash('sha256').update(key).digest('hex')}`;
}

export function resolveBackupTarget(value: unknown, target: BackupTarget) {
  const binding = z.object({
    binding: z.string(),
    database_id: z.string().uuid(),
    database_name: z.string(),
  });
  const env = z.object({ d1_databases: z.array(binding) });
  const config = z
    .object({
      account_id: z.string().regex(/^[a-f0-9]{32}$/),
      env: z.object({ preview: env, production: env }),
    })
    .parse(value);
  const selected =
    target === 'preview' ? config.env.preview : config.env.production;
  const databases = selected.d1_databases.filter(
    (item) => item.binding === 'DB',
  );
  const database = databases[0];
  if (
    databases.length !== 1 ||
    !database ||
    database.database_name !== `twe-${target}`
  )
    throw new Error(
      'Backup database binding does not match the selected TWE target.',
    );
  return {
    target,
    accountId: config.account_id,
    databaseId: database.database_id,
  };
}

export function assertProductionBackupReady(
  target: BackupTarget,
  databaseId: string,
  ready: string | undefined,
) {
  if (target === 'production' && ready !== databaseId)
    throw new Error(
      'Production backups require TWE_PRODUCTION_BACKUP_READY equal to the migrated production database UUID.',
    );
}

export function encryptBackup(
  sql: Uint8Array,
  key: Buffer,
  value: BackupMetadata,
) {
  const metadata = backupMetadataSchema.parse(value);
  if (metadata.keyId !== backupKeyId(key))
    throw new Error('Recovery key ID mismatch.');
  const format = 'twe-d1-aes256gcm-v2' as const;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(JSON.stringify({ format, ...metadata })));
  const data = Buffer.concat([cipher.update(sql), cipher.final()]);
  return {
    format,
    ...metadata,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
}

export function decryptBackup(value: unknown, key: Buffer): Buffer {
  const common = { iv: z.string(), tag: z.string(), data: z.string() };
  const envelope = z
    .discriminatedUnion('format', [
      z.object({
        format: z.literal('twe-d1-aes256gcm-v1'),
        target: z.string(),
        createdAt: z.string(),
        ...common,
      }),
      backupMetadataSchema.extend({
        format: z.literal('twe-d1-aes256gcm-v2'),
        ...common,
      }),
    ])
    .parse(value);
  let aad: object;
  if (envelope.format === 'twe-d1-aes256gcm-v1') {
    aad = {
      format: envelope.format,
      target: envelope.target,
      createdAt: envelope.createdAt,
    };
  } else {
    if (envelope.keyId !== backupKeyId(key))
      throw new Error('Recovery key ID mismatch.');
    aad = { format: envelope.format, ...backupMetadataSchema.parse(envelope) };
  }
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  if (iv.byteLength !== 12 || tag.byteLength !== 16)
    throw new Error('Invalid backup encryption parameters.');
  const cipher = createDecipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(JSON.stringify(aad)));
  cipher.setAuthTag(tag);
  return Buffer.concat([
    cipher.update(Buffer.from(envelope.data, 'base64')),
    cipher.final(),
  ]);
}
