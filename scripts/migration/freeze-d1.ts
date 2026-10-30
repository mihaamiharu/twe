import { z } from 'zod';
import { createD1Client } from './d1-client';

const mode = z.enum(['freeze', 'unfreeze', 'status']).parse(process.argv[2]);
const target = z
  .enum(['local', 'preview', 'production'])
  .parse(process.argv[3] ?? 'local');
const client = await createD1Client(target);
try {
  if (mode !== 'status')
    await client.run([
      {
        sql: "UPDATE app_control SET value = ? WHERE key = 'writes_frozen'",
        params: [mode === 'freeze' ? 1 : 0],
      },
    ]);
  const row = z
    .object({ value: z.union([z.literal(0), z.literal(1)]) })
    .parse(
      (
        await client.run([
          { sql: "SELECT value FROM app_control WHERE key = 'writes_frozen'" },
        ])
      )[0]?.[0],
    );
  console.log(JSON.stringify({ target, writesFrozen: row.value === 1 }));
} finally {
  await client.dispose();
}
