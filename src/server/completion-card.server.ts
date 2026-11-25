import { and, eq, inArray } from 'drizzle-orm';
import { getRuntimeEnv } from '#platform';
import { db } from '@/db';
import {
  challenges as challengesTable,
  progress,
  tutorials,
} from '@/db/schema';
import {
  buildCompletionCardSigningMessage,
  getTrackCompletionCopy,
  isCompletionEligible,
  isValidCompletionSlugFormat,
  isValidSignatureFormat,
  normalizeCompletionKind,
  normalizeCompletionLocale,
  validateLearnerNameInput,
  WEB_AUTOMATION_TRACK_SLUG,
  type CompletionCardKind,
  type CompletionCardLocale,
  type CompletionCardPayload,
  type CompletionCardRenderProps,
} from '@/lib/completion-card';
import { getTutorialCatalogList } from './content-catalog.server';
import { OgRenderError } from './og-errors.server';

const SIGNATURE_BYTE_LENGTH = 24;
const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function resolveSigningSecret(explicitSecret?: string): string {
  const secret = explicitSecret ?? getRuntimeEnv().BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Completion card signing secret is not configured.');
  }
  return secret;
}

export async function signCompletionCardPayload(
  payload: CompletionCardPayload,
  explicitSecret?: string,
): Promise<string> {
  const secret = resolveSigningSecret(explicitSecret);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const message = buildCompletionCardSigningMessage(payload);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message),
  );
  return encodeBase64Url(
    new Uint8Array(signature).slice(0, SIGNATURE_BYTE_LENGTH),
  );
}

export async function verifyCompletionCardSignature(
  payload: CompletionCardPayload,
  signature: string,
  explicitSecret?: string,
): Promise<boolean> {
  if (!isValidSignatureFormat(signature)) return false;
  const expected = await signCompletionCardPayload(payload, explicitSecret);
  return constantTimeEqual(expected, signature.trim());
}

export interface CompletionCardQueryInput {
  kind?: string | null;
  slug?: string | null;
  locale?: string | null;
  learner?: string | null;
  sig?: string | null;
}

/**
 * Validate, verify signature, and resolve canonical catalog metadata for a
 * completion OG card. Uses only the bundled editorial catalog (zero D1 reads).
 */
export async function resolveCompletionCardFromCatalog(
  input: CompletionCardQueryInput,
  explicitSecret?: string,
): Promise<CompletionCardRenderProps> {
  const kind = normalizeCompletionKind(input.kind);
  if (!kind) {
    throw new OgRenderError(400, 'Invalid completion card kind.');
  }

  const locale = normalizeCompletionLocale(input.locale ?? 'en');
  if (!locale) {
    throw new OgRenderError(400, 'Invalid completion card locale.');
  }

  const slug = input.slug?.trim() ?? '';
  if (!isValidCompletionSlugFormat(slug)) {
    throw new OgRenderError(400, 'Invalid completion card slug.');
  }

  const learnerResult = validateLearnerNameInput(input.learner);
  if (!learnerResult.ok) {
    throw new OgRenderError(
      422,
      'Display name cannot contain an email address or unsupported characters.',
    );
  }

  const payload: CompletionCardPayload = {
    kind,
    slug,
    locale,
    learner: learnerResult.value,
  };

  const sig = input.sig?.trim() ?? '';
  const validSignature = await verifyCompletionCardSignature(
    payload,
    sig,
    explicitSecret,
  );
  if (!validSignature) {
    throw new OgRenderError(
      403,
      'Invalid or missing completion card signature.',
    );
  }

  const catalog = await getTutorialCatalogList(locale);
  const moduleDefinitions = [
    ...new Map(
      catalog.map((tutorial) => [tutorial.module.slug, tutorial.module]),
    ).values(),
  ].sort((left, right) => left.order - right.order);

  if (kind === 'track') {
    if (slug !== WEB_AUTOMATION_TRACK_SLUG) {
      throw new OgRenderError(404, 'Unknown completion track.');
    }
    const coreLessons = catalog.filter(
      (tutorial) => tutorial.kind === 'core',
    ).length;
    const corePractice = new Set(
      catalog.flatMap((tutorial) =>
        tutorial.practice
          .filter((practice) => practice.role === 'core')
          .map((practice) => practice.slug),
      ),
    ).size;
    const copy = getTrackCompletionCopy(locale);

    return {
      kind: 'track',
      locale,
      slug,
      title: copy.title,
      subtitle: copy.subtitle,
      learner: payload.learner,
      coreLessons,
      corePractice,
      moduleCount: moduleDefinitions.length,
    };
  }

  const moduleDefinition = moduleDefinitions.find(
    (module) => module.slug === slug,
  );
  if (!moduleDefinition) {
    throw new OgRenderError(404, 'Unknown completion module.');
  }

  const moduleTutorials = catalog.filter(
    (tutorial) => tutorial.module.slug === slug,
  );
  const coreLessons = moduleTutorials.filter(
    (tutorial) => tutorial.kind === 'core',
  ).length;
  const corePractice = new Set(
    moduleTutorials.flatMap((tutorial) =>
      tutorial.practice
        .filter((practice) => practice.role === 'core')
        .map((practice) => practice.slug),
    ),
  ).size;

  return {
    kind: 'module',
    locale,
    slug,
    moduleOrder: moduleDefinition.order,
    title: moduleDefinition.title,
    subtitle: moduleDefinition.outcome || moduleDefinition.description,
    learner: payload.learner,
    coreLessons,
    corePractice,
  };
}

export type CompletionEligibilityResult =
  | {
      eligible: true;
      title: string;
      moduleOrder?: number;
      coreLessons: number;
      corePractice: number;
    }
  | {
      eligible: false;
      reason: 'not_found' | 'not_completed';
    };

/**
 * Verify against D1 that a signed-in user has actually completed the requested
 * Learn module or the Web Automation track before minting a signed share URL.
 */
export async function checkUserCompletionEligibility(
  userId: string,
  kind: CompletionCardKind,
  slug: string,
  locale: CompletionCardLocale,
): Promise<CompletionEligibilityResult> {
  if (!isValidCompletionSlugFormat(slug)) {
    return { eligible: false, reason: 'not_found' };
  }

  const catalog = await getTutorialCatalogList(locale);
  const dbTutorials = catalog.length
    ? await db
        .select({
          id: tutorials.id,
          slug: tutorials.slug,
          isPublished: tutorials.isPublished,
        })
        .from(tutorials)
        .where(
          inArray(
            tutorials.slug,
            catalog.map((tutorial) => tutorial.slug),
          ),
        )
    : [];
  const dbTutorialBySlug = new Map(
    dbTutorials.map((record) => [record.slug, record]),
  );

  const publishedCatalog = catalog.filter(
    (tutorial) => dbTutorialBySlug.get(tutorial.slug)?.isPublished !== false,
  );

  let targetTutorials = publishedCatalog;
  let title = getTrackCompletionCopy(locale).title;
  let moduleOrder: number | undefined;

  if (kind === 'track') {
    if (slug !== WEB_AUTOMATION_TRACK_SLUG || publishedCatalog.length === 0) {
      return { eligible: false, reason: 'not_found' };
    }
  } else {
    targetTutorials = publishedCatalog.filter(
      (tutorial) => tutorial.module.slug === slug,
    );
    const first = targetTutorials[0];
    if (!first) {
      return { eligible: false, reason: 'not_found' };
    }
    title = first.module.title;
    moduleOrder = first.module.order;
  }

  const coreLessons = targetTutorials.filter(
    (tutorial) => tutorial.kind === 'core',
  );
  const corePracticeSlugs = [
    ...new Set(
      targetTutorials.flatMap((tutorial) =>
        tutorial.practice
          .filter((practice) => practice.role === 'core')
          .map((practice) => practice.slug),
      ),
    ),
  ];

  const requiredTutorialIds = coreLessons
    .map((tutorial) => dbTutorialBySlug.get(tutorial.slug)?.id)
    .filter((id): id is string => Boolean(id));

  let completedCoreLessons = 0;
  if (requiredTutorialIds.length === coreLessons.length && coreLessons.length > 0) {
    const tutorialProgress = await db
      .select({
        tutorialId: progress.tutorialId,
        isCompleted: progress.isCompleted,
      })
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          eq(progress.isCompleted, true),
          inArray(progress.tutorialId, requiredTutorialIds),
        ),
      );
    const completedTutorialIds = new Set(
      tutorialProgress
        .map((row) => row.tutorialId)
        .filter((id): id is string => Boolean(id)),
    );
    completedCoreLessons = requiredTutorialIds.filter((id) =>
      completedTutorialIds.has(id),
    ).length;
  }

  let completedCorePractice = 0;
  if (corePracticeSlugs.length > 0) {
    const challengeRecords = await db
      .select({
        id: challengesTable.id,
        slug: challengesTable.slug,
      })
      .from(challengesTable)
      .where(inArray(challengesTable.slug, corePracticeSlugs));

    if (challengeRecords.length === corePracticeSlugs.length) {
      const challengeProgress = await db
        .select({
          challengeId: progress.challengeId,
          isCompleted: progress.isCompleted,
        })
        .from(progress)
        .where(
          and(
            eq(progress.userId, userId),
            eq(progress.isCompleted, true),
            inArray(
              progress.challengeId,
              challengeRecords.map((record) => record.id),
            ),
          ),
        );
      const completedChallengeIds = new Set(
        challengeProgress
          .map((row) => row.challengeId)
          .filter((id): id is string => Boolean(id)),
      );
      completedCorePractice = challengeRecords.filter((record) =>
        completedChallengeIds.has(record.id),
      ).length;
    }
  }

  const eligible = isCompletionEligible({
    coreLessons: coreLessons.length,
    completedCoreLessons,
    corePractice: corePracticeSlugs.length,
    completedCorePractice,
  });

  if (!eligible) {
    return { eligible: false, reason: 'not_completed' };
  }

  return {
    eligible: true,
    title,
    ...(moduleOrder !== undefined ? { moduleOrder } : {}),
    coreLessons: coreLessons.length,
    corePractice: corePracticeSlugs.length,
  };
}
