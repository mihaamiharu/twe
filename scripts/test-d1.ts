import { createTestSandbox } from './test-sandbox';

const sandbox = await createTestSandbox('http://localhost:3000');
try {
  await sandbox.migrate();
  const files = [
    ...new Bun.Glob('src/tests/integration/**/*.test.ts').scanSync('.'),
  ].sort();
  for (const file of files) {
    // Each file gets a fresh module registry so Bun mock.module fixtures cannot
    // replace the real auth/DB implementation in another integration suite.
    await sandbox.run([
      'test',
      '--timeout',
      '30000',
      file,
      ...process.argv.slice(2).filter((value) => value !== '--'),
    ]);
  }
} finally {
  await sandbox.dispose();
}
