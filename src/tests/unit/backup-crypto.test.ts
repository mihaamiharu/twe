import { test, expect } from 'bun:test';
import { createCipheriv, randomBytes } from 'node:crypto';
import {
  assertProductionBackupReady,
  backupKeyId,
  decryptBackup,
  encryptBackup,
  parseBackupKey,
  resolveBackupTarget,
} from '../../../scripts/backup/model';

test('authenticates the exact source, database, key and ciphertext while supporting rotation', () => {
  const key = randomBytes(32);
  const metadata = {
    target: 'preview' as const,
    databaseId: 'a57397b4-3f7f-432e-a161-04330b3a5b4b',
    sourceCommit: 'a'.repeat(40),
    keyId: backupKeyId(key),
    createdAt: '2026-11-01T00:00:00.000Z',
  };
  const sql = Buffer.from(
    "CREATE TABLE x(value TEXT); INSERT INTO x VALUES('private 👋');",
  );
  const envelope = encryptBackup(sql, key, metadata);
  expect(decryptBackup(envelope, key)).toEqual(sql);
  expect(parseBackupKey(key.toString('base64'))).toEqual(key);
  expect(() => parseBackupKey(key.toString('base64') + '!')).toThrow();
  expect(() => decryptBackup(envelope, randomBytes(32))).toThrow();
  for (const change of [
    { target: 'production' },
    { databaseId: '6f6630be-ed32-4d07-ba24-24d45bb160c9' },
    { sourceCommit: 'b'.repeat(40) },
    { createdAt: '2026-11-02T00:00:00.000Z' },
    { keyId: backupKeyId(randomBytes(32)) },
    { data: Buffer.from('modified ciphertext').toString('base64') },
  ])
    expect(() => decryptBackup({ ...envelope, ...change }, key)).toThrow();
});

test('retained v1 archives still decrypt with their original keys', () => {
  const key = randomBytes(32),
    iv = randomBytes(12);
  const metadata = {
    format: 'twe-d1-aes256gcm-v1',
    target: 'preview',
    createdAt: '2026-10-30T00:00:00Z',
  };
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(JSON.stringify(metadata)));
  const data = Buffer.concat([cipher.update('legacy SQL'), cipher.final()]);
  expect(
    decryptBackup(
      {
        ...metadata,
        iv: iv.toString('base64'),
        tag: cipher.getAuthTag().toString('base64'),
        data: data.toString('base64'),
      },
      key,
    ).toString(),
  ).toBe('legacy SQL');
});

test('production cannot back up the unmigrated candidate and cross-target bindings fail closed', () => {
  const id = '6f6630be-ed32-4d07-ba24-24d45bb160c9';
  expect(() =>
    assertProductionBackupReady('production', id, undefined),
  ).toThrow();
  expect(() =>
    assertProductionBackupReady('production', id, 'wrong'),
  ).toThrow();
  expect(() => assertProductionBackupReady('production', id, id)).not.toThrow();
  expect(() =>
    assertProductionBackupReady('preview', id, undefined),
  ).not.toThrow();
  const config = {
    account_id: 'd5f9db115e5d7b5156bb210e04ecb34e',
    env: {
      preview: {
        d1_databases: [
          {
            binding: 'DB',
            database_name: 'twe-preview',
            database_id: 'a57397b4-3f7f-432e-a161-04330b3a5b4b',
          },
        ],
      },
      production: {
        d1_databases: [
          { binding: 'DB', database_name: 'twe-production', database_id: id },
        ],
      },
    },
  };
  expect(resolveBackupTarget(config, 'production').databaseId).toBe(id);
  config.env.production.d1_databases[0]!.database_name = 'twe-preview';
  expect(() => resolveBackupTarget(config, 'production')).toThrow();
});
