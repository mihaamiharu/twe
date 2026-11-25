import {
  buildCompletionCardFilename,
  buildCompletionCardPath,
  buildCompletionShareText,
  getSafeLearnerDisplayName,
  type CompletionCardPayload,
} from '@/lib/completion-card';
import { logger } from '@/lib/logger';
import {
  checkUserCompletionEligibility,
  signCompletionCardPayload,
  type CompletionEligibilityResult,
} from './completion-card.server';

export interface CreateCompletionCardShareInput {
  kind: 'module' | 'track';
  slug: string;
  locale: 'en' | 'id';
  includeName: boolean;
}

export interface CompletionCardShareData {
  imagePath: string;
  filename: string;
  title: string;
  learner: string | null;
  shareText: string;
}

export type CompletionCardShareResponse =
  | { success: true; data: CompletionCardShareData }
  | { success: false; error: string };

export interface CompletionCardShareDeps {
  checkEligibility?: (
    userId: string,
    kind: CreateCompletionCardShareInput['kind'],
    slug: string,
    locale: CreateCompletionCardShareInput['locale'],
  ) => Promise<CompletionEligibilityResult>;
  signPayload?: (payload: CompletionCardPayload) => Promise<string>;
}

export async function createCompletionCardShareHandler(
  {
    data,
    context,
  }: {
    data: CreateCompletionCardShareInput;
    context?: { user?: { id?: string; name?: string | null } } | undefined;
  },
  deps: CompletionCardShareDeps = {},
): Promise<CompletionCardShareResponse> {
  try {
    const userId = context?.user?.id;
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const checkEligibility =
      deps.checkEligibility ?? checkUserCompletionEligibility;
    const eligibility = await checkEligibility(
      userId,
      data.kind,
      data.slug,
      data.locale,
    );

    if (!eligibility.eligible) {
      return {
        success: false,
        error:
          eligibility.reason === 'not_found'
            ? 'Completion item not found.'
            : 'Complete all core lessons and practice challenges to unlock this shareable card.',
      };
    }

    // Opt-in privacy: only include a sanitized display name when requested,
    // and never derive or expose any email address or user identifier.
    const learner = data.includeName
      ? getSafeLearnerDisplayName(context.user?.name)
      : null;

    const payload: CompletionCardPayload = {
      kind: data.kind,
      slug: data.slug,
      locale: data.locale,
      learner,
    };

    const signPayload = deps.signPayload ?? signCompletionCardPayload;
    const signature = await signPayload(payload);

    return {
      success: true,
      data: {
        imagePath: buildCompletionCardPath(payload, signature),
        filename: buildCompletionCardFilename(data.kind, data.slug),
        title: eligibility.title,
        learner,
        shareText: buildCompletionShareText({
          kind: data.kind,
          locale: data.locale,
          title: eligibility.title,
          ...(eligibility.moduleOrder !== undefined
            ? { moduleOrder: eligibility.moduleOrder }
            : {}),
        }),
      },
    };
  } catch (error) {
    logger.error('Error generating completion card share link:', error);
    return {
      success: false,
      error: 'Unable to prepare your completion card right now.',
    };
  }
}
