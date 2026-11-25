import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { isValidCompletionSlugFormat } from '@/lib/completion-card';
import { authMiddleware } from './auth.mw';
import {
  createCompletionCardShareHandler,
  type CreateCompletionCardShareInput,
} from './completion-card-share.server';

export type {
  CompletionCardShareData,
  CompletionCardShareResponse,
  CreateCompletionCardShareInput,
} from './completion-card-share.server';

const CreateCompletionCardShareSchema = z.object({
  kind: z.enum(['module', 'track']),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .refine(isValidCompletionSlugFormat, 'Invalid completion card slug'),
  locale: z.enum(['en', 'id']).default('en'),
  includeName: z.boolean().default(false),
});
export const createCompletionCardShare = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) =>
    CreateCompletionCardShareSchema.parse(data) satisfies CreateCompletionCardShareInput,
  )
  .handler(async ({ data, context }) =>
    createCompletionCardShareHandler({ data, context }),
  );
