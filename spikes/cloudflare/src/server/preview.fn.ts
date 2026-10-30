import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { user } from '../db/schema';
import { previewMiddleware, syntheticUserMiddleware } from './preview.mw';

const emptyInput = z.object({});

export const getPreviewStatus = createServerFn({ method: 'GET' })
  .middleware([previewMiddleware])
  .inputValidator(emptyInput)
  .handler(async ({ context }) => {
    const row = await context.bindings.DB.prepare('SELECT 1 AS connected').first<{ connected: number }>();
    return {
      environment: context.config.DEPLOYMENT_ENV,
      databaseConnected: row?.connected === 1,
      scope: 'Synthetic preview only; product compatibility remains unverified.',
    };
  });

export const createSyntheticAccount = createServerFn({ method: 'POST' })
  .middleware([previewMiddleware])
  .inputValidator(emptyInput)
  .handler(async ({ context }) => {
    const [total] = await context.db.select({ value: count() }).from(user);
    if ((total?.value ?? 0) >= 100) throw new Error('Synthetic account limit reached.');
    const { getPreviewAuth, SYNTHETIC_PASSWORD } = await import('./auth.server');
    const syntheticId = crypto.randomUUID();
    const result = await getPreviewAuth(context).api.signUpEmail({
      headers: getRequest().headers,
      body: {
        email: `${syntheticId}@example.invalid`,
        password: SYNTHETIC_PASSWORD,
        name: 'Synthetic preview user',
      },
    });
    return { syntheticId, userId: result.user.id };
  });

export const signInSyntheticAccount = createServerFn({ method: 'POST' })
  .middleware([previewMiddleware])
  .inputValidator(z.object({ syntheticId: z.uuid() }))
  .handler(async ({ context, data }) => {
    const { getPreviewAuth, SYNTHETIC_PASSWORD } = await import('./auth.server');
    const result = await getPreviewAuth(context).api.signInEmail({
      headers: getRequest().headers,
      body: { email: `${data.syntheticId}@example.invalid`, password: SYNTHETIC_PASSWORD },
    });
    return { userId: result.user.id };
  });

export const getSyntheticSession = createServerFn({ method: 'GET' })
  .middleware([syntheticUserMiddleware])
  .inputValidator(emptyInput)
  .handler(async ({ context }) => {
    const [row] = await context.db.select({ xp: user.xp }).from(user).where(eq(user.id, context.user.id));
    return { userId: context.user.id, xp: row?.xp ?? 0 };
  });

export const sampleResetPasswordHash = createServerFn({ method: 'POST' })
  .middleware([syntheticUserMiddleware])
  .inputValidator(emptyInput)
  .handler(async () => {
    const { hashPassword, verifyPassword } = await import('better-auth/crypto');
    const syntheticPassword = crypto.randomUUID();
    const hash = await hashPassword(syntheticPassword);
    return { verified: await verifyPassword({ hash, password: syntheticPassword }) };
  });

export const signOutSyntheticAccount = createServerFn({ method: 'POST' })
  .middleware([syntheticUserMiddleware])
  .inputValidator(emptyInput)
  .handler(async ({ context }) => {
    await context.auth.api.signOut({ headers: getRequest().headers });
    return { signedOut: true };
  });

export const completeSyntheticLesson = createServerFn({ method: 'POST' })
  .middleware([syntheticUserMiddleware])
  .inputValidator(z.object({
    lessonId: z.enum(['lesson-a', 'lesson-b']),
    injectFailure: z.boolean().default(false),
  }))
  .handler(async ({ context, data }) => {
    const eventId = crypto.randomUUID();
    const database = context.bindings.DB;
    const statements = [database.prepare(
      'INSERT INTO spike_reward_ledger (event_id, user_id, lesson_id, xp) VALUES (?, ?, ?, 100) ON CONFLICT(user_id, lesson_id) DO NOTHING',
    ).bind(eventId, context.user.id, data.lessonId)];
    if (data.injectFailure) {
      // A deliberate CHECK failure should roll back the entire native D1 batch.
      statements.push(database.prepare('INSERT INTO spike_failure_guard (value) VALUES (0)'));
    }
    statements.push(
      database.prepare(
        'UPDATE spike_users SET xp = xp + 100 WHERE id = ? AND EXISTS (SELECT 1 FROM spike_reward_ledger WHERE event_id = ?)',
      ).bind(context.user.id, eventId),
      database.prepare('SELECT xp FROM spike_users WHERE id = ?').bind(context.user.id),
    );
    const results = await database.batch<{ xp: number }>(statements);
    return {
      awarded: results[0]?.meta.changes === 1,
      xp: results.at(-1)?.results[0]?.xp ?? 0,
      rowsRead: results.reduce((sum, result) => sum + result.meta.rows_read, 0),
      rowsWritten: results.reduce((sum, result) => sum + result.meta.rows_written, 0),
    };
  });
