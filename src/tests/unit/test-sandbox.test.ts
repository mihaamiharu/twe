import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { createTestSandbox } from '../../../scripts/test-sandbox';

describe('disposable test authentication', () => {
  test('shares a fresh seeding secret between Worker bindings and child processes', async () => {
    const inheritedSecret = process.env.E2E_SECRET;
    process.env.E2E_SECRET = 'stale-secret-from-another-run';
    const sandbox = await createTestSandbox('http://127.0.0.1:34567');
    try {
      const config: unknown = await Bun.file(sandbox.configPath).json();
      const { vars } = z
        .object({ vars: z.object({ E2E_SECRET: z.string().uuid() }) })
        .parse(config);
      expect(vars.E2E_SECRET).toBe(sandbox.env.E2E_SECRET);
      expect(vars.E2E_SECRET).toBe(sandbox.e2eSecret);
      expect(vars.E2E_SECRET).not.toBe('stale-secret-from-another-run');
    } finally {
      await sandbox.dispose();
      if (inheritedSecret === undefined) delete process.env.E2E_SECRET;
      else process.env.E2E_SECRET = inheritedSecret;
    }
  });
});
