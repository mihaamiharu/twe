import { z } from 'zod';

export const GetHintSchema = z.object({
  challengeSlug: z.string().min(1).max(160),
  userAttempt: z.string().max(16_000).optional(),
  locale: z.enum(['en', 'id']).default('en'),
  staticHints: z.array(z.string().max(2_000)).max(10).optional(),
});

export const MAX_HINT_PROMPT_BYTES = 32_000;
export const MAX_HINT_OUTPUT_TOKENS = 1_024;

/** Missing or malformed configuration never enables billable generation. */
export function dailyHintLimit(value: string | undefined): number {
  if (!value || !/^[1-9]\d{0,3}$/.test(value)) return 0;
  return Number(value);
}
