import { z } from 'zod';
import { LEARN_DIFFICULTIES } from './learn-catalog';

/** Parse URL booleans without treating every non-empty string as true. */
export const learnBooleanSearchParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))
  .optional();

export const LearnSearchSchema = z.object({
  q: z.string().optional(),
  difficulty: z.enum(['all', ...LEARN_DIFFICULTIES]).optional(),
  view: z.enum(['grid', 'list']).optional(),
  hideCompleted: learnBooleanSearchParam,
});

export type LearnSearch = z.infer<typeof LearnSearchSchema>;
