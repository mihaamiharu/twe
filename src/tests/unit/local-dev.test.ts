import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createLocalEnv,
  ensureLocalEnv,
  localCommands,
  localDatabaseUrl,
  localEnvironment,
} from '../../../scripts/local-dev';

describe('cross-platform local development', () => {
  test('creates .env once and preserves an existing file on repeat setup', () => {
    const directory = mkdtempSync(join(tmpdir(), 'twe-local-dev-'));
    try {
      const envPath = join(directory, '.env');
      const templatePath = join(directory, '.env.example');
      writeFileSync(templatePath, 'BETTER_AUTH_SECRET="placeholder"\n');
      expect(ensureLocalEnv(envPath, templatePath)).toBe(true);
      const created = readFileSync(envPath, 'utf8');
      expect(created).toMatch(/BETTER_AUTH_SECRET="[a-f0-9]{64}"/);
      const custom = `${created}CUSTOM_SETTING="keep me"\n`;
      writeFileSync(envPath, custom);
      expect(ensureLocalEnv(envPath, templatePath)).toBe(false);
      expect(readFileSync(envPath, 'utf8')).toBe(custom);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
  test('generates a unique auth secret without changing other configuration', () => {
    const template = `DATABASE_URL="${localDatabaseUrl}"\nBETTER_AUTH_SECRET="placeholder"\nREQUIRE_EMAIL_VERIFICATION="false"\n`;
    const result = createLocalEnv(template);
    expect(result).toMatch(/BETTER_AUTH_SECRET="[a-f0-9]{64}"/);
    expect(result).toContain(`DATABASE_URL="${localDatabaseUrl}"`);
    expect(result).toContain('REQUIRE_EMAIL_VERIFICATION="false"');
    expect(createLocalEnv(template)).not.toBe(result);
  });

  test('rejects custom or remote migration targets', () => {
    expect(() =>
      localEnvironment({ DATABASE_URL: 'postgresql://remote/db' }),
    ).toThrow();
    expect(() =>
      localEnvironment({ DIRECT_URL: 'postgresql://remote/db' }),
    ).toThrow();
  });

  test('runs local development with local auth and database settings', () => {
    expect(
      localEnvironment({
        NODE_ENV: 'production',
        TEST_DATABASE_URL: 'postgresql://remote/test',
        OTHER: 'preserved',
      }),
    ).toMatchObject({
      DATABASE_URL: localDatabaseUrl,
      DIRECT_URL: '',
      TEST_DATABASE_URL: '',
      NODE_ENV: 'development',
      BETTER_AUTH_URL: 'http://localhost:3000',
      OTHER: 'preserved',
    });
  });

  test('setup initializes only the dev database, in dependency order', () => {
    expect(localCommands('setup', 'docker')).toEqual([
      [
        'docker',
        'compose',
        '-f',
        'docker-compose.yml',
        'up',
        '-d',
        '--wait',
        'postgres',
      ],
      ['bun', 'run', 'db:migrate'],
      ['bun', 'run', 'db:sync'],
    ]);
  });

  test('daily startup skips migrations and stop preserves the volume', () => {
    expect(localCommands('dev', 'podman')).toEqual([
      [
        'podman',
        'compose',
        '-f',
        'docker-compose.yml',
        'up',
        '-d',
        '--wait',
        'postgres',
      ],
      ['bun', 'run', 'dev'],
    ]);
    expect(localCommands('stop', 'docker')[0]).toEqual([
      'docker',
      'compose',
      '-f',
      'docker-compose.yml',
      'stop',
      'postgres',
    ]);
    expect(() => localCommands('unknown', 'docker')).toThrow();
  });
});
