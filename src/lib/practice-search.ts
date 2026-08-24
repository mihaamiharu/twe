import { z } from 'zod';
import { TRACK_IDS } from '@/config/tracks';

export const PracticeDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
const BooleanSearchParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))
  .optional();

/** Public Practice discovery state. Internal tier data is not URL-backed. */
export const PracticeSearchSchema = z
  .object({
    track: z.enum(TRACK_IDS).optional(),
    q: z.string().optional(),
    difficulty: PracticeDifficultySchema.optional(),
    hideCompleted: BooleanSearchParam,
    view: z.enum(['grid', 'list']).optional(),
  })
  .strip();

export type PracticeSearch = z.infer<typeof PracticeSearchSchema>;
