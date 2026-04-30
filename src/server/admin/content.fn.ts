import { createServerFn } from '@tanstack/react-start';
import { adminMiddleware } from '../auth.mw';
import { syncTutorials } from '../../scripts/sync-tutorials';
import { syncChallenges } from '../../scripts/sync-challenges';

export const syncContentFn = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .handler(async ({ context }) => {
    try {
      console.log(`[Admin] Manual content sync triggered by user ${context.user.id}`);

      await syncTutorials();

      await syncChallenges();

      return { success: true, message: 'Content synchronized successfully (skipping extraction - seeds missing)' };
    } catch (error) {
      console.error('[Admin] Content sync failed:', error);
      return { success: false, error: String(error) };
    }
  });
