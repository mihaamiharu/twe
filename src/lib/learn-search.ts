import { z } from 'zod';

/** Parse URL booleans without treating every non-empty string as true. */
export const learnBooleanSearchParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))
  .optional();

export const LearnSearchSchema = z.object({
  q: z.string().optional(),
  hideCompleted: learnBooleanSearchParam,
});

export type LearnSearch = z.infer<typeof LearnSearchSchema>;
