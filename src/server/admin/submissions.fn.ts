import { createServerFn } from '@tanstack/react-start';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { submissions } from '@/db/schema';

export const getAdminSubmissions = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const submissionsList = await db.query.submissions.findMany({
        orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
        limit: 100,
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
          challenge: {
            columns: {
              title: true,
              slug: true,
            },
          },
        },
      });

      return { success: true, data: submissionsList };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch submissions:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
