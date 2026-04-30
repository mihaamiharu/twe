import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminMiddleware } from '../auth.mw';
import { db } from '@/db';
import { bugReports } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const getAdminBugs = createServerFn({ method: 'GET' })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const bugs = await db.query.bugReports.findMany({
        orderBy: (bugReports, { desc }) => [desc(bugReports.createdAt)],
        with: {
          user: {
            columns: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return { success: true, data: bugs };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to fetch bug reports:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });

const UpdateBugStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  adminNotes: z.string().optional(),
});

export const updateBugStatus = createServerFn({ method: 'POST' })
  .middleware([adminMiddleware])
  .inputValidator((data: unknown) => UpdateBugStatusSchema.parse(data))
  .handler(async ({ data: input }) => {
    try {
      type BugReportUpdate = {
        status?: typeof input.status;
        adminNotes?: string;
        updatedAt: Date;
      };

      const updateData: BugReportUpdate = {
        updatedAt: new Date(),
      };

      if (input.status) {
        updateData.status = input.status;
      }
      if (input.adminNotes !== undefined) {
        updateData.adminNotes = input.adminNotes;
      }

      await db
        .update(bugReports)
        .set(updateData as typeof bugReports.$inferInsert)
        .where(eq(bugReports.id, input.id));

      return { success: true, message: 'Bug report updated' };
    } catch (ignored) {
      const error = ignored as Error;
      console.error('Failed to update bug report:', error);
      return { success: false, error: 'Internal Server Error' };
    }
  });
