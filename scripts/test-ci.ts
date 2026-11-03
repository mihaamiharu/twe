for (const task of [
  'lint',
  'typecheck',
  'test:unit',
  'test:integration',
  'build',
]) {
  const child = Bun.spawn([process.execPath, 'run', task], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const code = await child.exited;
  if (code !== 0) process.exit(code);
}
