import { copyFile, readFile, writeFile } from 'node:fs/promises';

const action = process.argv[2] ?? 'dev';
if (action === 'stop') {
  console.log('D1 runs inside the development process; stop it with Ctrl-C.');
  process.exit(0);
}
if (action === 'setup') {
  try {
    await readFile('.dev.vars');
    console.log('Preserving existing .dev.vars.');
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    )
      throw error;
    await copyFile('.dev.vars.example', '.dev.vars');
    const template = await readFile('.dev.vars', 'utf8');
    await writeFile(
      '.dev.vars',
      template.replace(
        'replace-with-at-least-32-random-characters',
        `${crypto.randomUUID()}-${crypto.randomUUID()}`,
      ),
      { mode: 0o600 },
    );
  }
}
const tasks =
  action === 'setup'
    ? ['db:migrate', 'db:sync']
    : action === 'up'
      ? ['db:migrate']
      : ['dev'];
for (const task of tasks) {
  const child = Bun.spawn([process.execPath, 'run', task], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await child.exited;
  if (code !== 0) process.exit(code);
}
