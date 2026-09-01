import { z } from 'zod';
import { TRACK_IDS } from '@/config/tracks';

export const PracticeDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
export const PracticeTierSchema = z.enum([
  'basic',
  'beginner',
  'intermediate',
  'e2e',
]);
const BooleanSearchParam = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => (typeof value === 'boolean' ? value : value === 'true'))
  .optional();

const OptionalTrackSearchParam = z.enum(TRACK_IDS).optional().catch(undefined);
const OptionalQuerySearchParam = z.string().optional().catch(undefined);
const OptionalTierSearchParam = PracticeTierSchema.optional().catch(undefined);
const OptionalDifficultySearchParam =
  PracticeDifficultySchema.optional().catch(undefined);
const OptionalBooleanSearchParam = BooleanSearchParam.catch(undefined);
const OptionalViewSearchParam = z
  .enum(['grid', 'list'])
  .optional()
  .catch(undefined);

/** Public Practice discovery state. */
export const PracticeSearchSchema = z
  .object({
    track: OptionalTrackSearchParam,
    q: OptionalQuerySearchParam,
    tier: OptionalTierSearchParam,
    difficulty: OptionalDifficultySearchParam,
    hideCompleted: OptionalBooleanSearchParam,
    view: OptionalViewSearchParam,
  })
  .strip();

export type PracticeSearch = z.infer<typeof PracticeSearchSchema>;
