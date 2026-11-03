import { prepareD1RestoreSql } from './migration/d1-restore-sql';

const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw new Error(
    'Usage: bun scripts/prepare-d1-restore.ts /private/decrypted.sql /private/new-restore.sql',
  );
try {
  const counts = await prepareD1RestoreSql(input, output);
  console.log(JSON.stringify({ event: 'd1_restore_sql_prepared', ...counts }));
} catch {
  console.error(
    'D1 restore preparation failed; no SQL or row contents are included in diagnostics.',
  );
  process.exitCode = 1;
}
