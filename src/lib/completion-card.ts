import type { TutorialListCatalogResponse } from './catalog.types';

export const WEB_AUTOMATION_TRACK_SLUG = 'web-automation' as const;

export const COMPLETION_CARD_KINDS = ['module', 'track'] as const;
export type CompletionCardKind = (typeof COMPLETION_CARD_KINDS)[number];

export const COMPLETION_CARD_LOCALES = ['en', 'id'] as const;
export type CompletionCardLocale = (typeof COMPLETION_CARD_LOCALES)[number];

export const MAX_LEARNER_NAME_LENGTH = 48;

export interface CompletionCardPayload {
  kind: CompletionCardKind;
  slug: string;
  locale: CompletionCardLocale;
  learner: string | null;
}

export interface CompletionCardRenderProps {
  kind: CompletionCardKind;
  locale: CompletionCardLocale;
  slug: string;
  moduleOrder?: number;
  title: string;
  subtitle: string;
  learner: string | null;
  coreLessons: number;
  corePractice: number;
  moduleCount?: number;
}

export interface EligibleCompletionCard {
  kind: CompletionCardKind;
  slug: string;
  order: number;
  title: string;
  description: string;
  coreLessons: number;
  corePractice: number;
  moduleCount?: number;
}

export interface CompletionProgressCounts {
  coreLessons: number;
  completedCoreLessons: number;
  corePractice: number;
  completedCorePractice: number;
}

export type LearnerNameValidationResult =
  | { ok: true; value: string | null }
  | { ok: false; reason: 'email' | 'invalid' };

const URL_PATTERN = /\b(?:https?:\/\/|mailto:|www\.)/iu;
const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{24,64}$/;

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }
  return false;
}

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

function boundedGraphemes(value: string, limit: number): string {
  const parts: string[] = [];
  let units = 0;
  for (const { segment } of graphemes.segment(value)) {
    if (
      parts.length === limit ||
      segment.length > 32 ||
      units + segment.length > limit * 8
    ) {
      return parts.join('') + '…';
    }
    parts.push(segment);
    units += segment.length;
  }
  return parts.join('');
}

export function normalizeCompletionKind(
  value?: string | null,
): CompletionCardKind | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'module' || normalized === 'track') {
    return normalized;
  }
  return null;
}

export function normalizeCompletionLocale(
  value?: string | null,
): CompletionCardLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'en' || normalized === 'id') {
    return normalized;
  }
  return null;
}

export function isValidCompletionSlugFormat(slug?: string | null): boolean {
  if (!slug) return false;
  const trimmed = slug.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) return false;

  let previousWasHyphen = false;
  for (let index = 0; index < trimmed.length; index++) {
    const code = trimmed.charCodeAt(index);
    const isLowerAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isHyphen = code === 45;
    if (!isLowerAlpha && !isDigit && !isHyphen) return false;
    if (isHyphen && previousWasHyphen) return false;
    previousWasHyphen = isHyphen;
  }
  return true;
}

export function isValidSignatureFormat(signature?: string | null): boolean {
  if (!signature) return false;
  return SIGNATURE_PATTERN.test(signature.trim());
}

/**
 * Detect email addresses, `@`-handles, or URLs so private contact data can
 * never appear in a public completion card URL or rendered PNG.
 */
export function looksLikeEmailOrContact(value: string): boolean {
  return value.includes('@') || URL_PATTERN.test(value);
}

/**
 * Validate and sanitize an optional learner display name for completion cards.
 * Rejects emails, URLs, and control characters explicitly so tampered URLs
 * receive an HTTP 422 rather than silently leaking or mangling PII.
 */
export function validateLearnerNameInput(
  raw?: string | null,
): LearnerNameValidationResult {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }

  const sliced = raw.slice(0, 512);
  if (hasControlCharacter(sliced)) {
    return { ok: false, reason: 'invalid' };
  }

  const normalized = sliced.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (!normalized) {
    return { ok: true, value: null };
  }

  if (looksLikeEmailOrContact(normalized)) {
    return { ok: false, reason: 'email' };
  }

  const bounded = boundedGraphemes(normalized, MAX_LEARNER_NAME_LENGTH);
  return { ok: true, value: bounded || null };
}

/**
 * Safely derive an opt-in display name from a user profile `name` field.
 * Returns null if missing or unsafe (e.g., if the user set an email as name).
 * Never accepts or falls back to `user.email`.
 */
export function getSafeLearnerDisplayName(name?: string | null): string | null {
  const result = validateLearnerNameInput(name);
  return result.ok ? result.value : null;
}

export function isCompletionEligible(counts: CompletionProgressCounts): boolean {
  const totalRequired = counts.coreLessons + counts.corePractice;
  if (totalRequired <= 0) return false;
  return (
    counts.completedCoreLessons >= counts.coreLessons &&
    counts.completedCorePractice >= counts.corePractice
  );
}

export function getTrackCompletionCopy(locale: CompletionCardLocale): {
  title: string;
  subtitle: string;
} {
  if (locale === 'id') {
    return {
      title: 'Jalur Otomasi Web',
      subtitle:
        'Menyelesaikan seluruh pelajaran inti dan latihan praktis Playwright di TestingWithEkki.',
    };
  }
  return {
    title: 'Web Automation Track',
    subtitle:
      'Completed every core lesson and hands-on Playwright challenge on TestingWithEkki.',
  };
}

export function getEligibleCompletionCards(
  meta: TutorialListCatalogResponse['meta'],
  locale: CompletionCardLocale,
): EligibleCompletionCard[] {
  const cards: EligibleCompletionCard[] = [];

  if (isCompletionEligible(meta.completion) && meta.modules.length > 0) {
    const trackCopy = getTrackCompletionCopy(locale);
    cards.push({
      kind: 'track',
      slug: WEB_AUTOMATION_TRACK_SLUG,
      order: 0,
      title: trackCopy.title,
      description: trackCopy.subtitle,
      coreLessons: meta.completion.coreLessons,
      corePractice: meta.completion.corePractice,
      moduleCount: meta.modules.length,
    });
  }

  const completedModules = [...meta.modules]
    .filter((module) => isCompletionEligible(module))
    .sort((left, right) => left.order - right.order);

  for (const module of completedModules) {
    cards.push({
      kind: 'module',
      slug: module.slug,
      order: module.order,
      title: module.title,
      description: module.outcome || module.description,
      coreLessons: module.coreLessons,
      corePractice: module.corePractice,
    });
  }

  return cards;
}

export function buildCompletionCardSigningMessage(
  payload: CompletionCardPayload,
): string {
  return [
    'twe-completion-card-v1',
    payload.kind,
    payload.slug,
    payload.locale,
    payload.learner ?? '',
  ].join('|');
}

export function buildCompletionCardPath(
  payload: CompletionCardPayload,
  signature: string,
): string {
  const params = new URLSearchParams({
    type: 'completion',
    kind: payload.kind,
    slug: payload.slug,
    locale: payload.locale,
  });
  if (payload.learner) {
    params.set('learner', payload.learner);
  }
  params.set('sig', signature);
  return `/api/og?${params.toString()}`;
}

export function buildCompletionCardFilename(
  kind: CompletionCardKind,
  slug: string,
): string {
  const safeSlug = isValidCompletionSlugFormat(slug) ? slug : 'completion';
  return kind === 'track'
    ? `testingwithekki-${safeSlug}-track.png`
    : `testingwithekki-module-${safeSlug}.png`;
}

export function buildCompletionShareText(options: {
  kind: CompletionCardKind;
  locale: CompletionCardLocale;
  title: string;
  moduleOrder?: number;
}): string {
  if (options.locale === 'id') {
    if (options.kind === 'track') {
      return `Saya baru saja menyelesaikan ${options.title} di TestingWithEkki — belajar otomasi web praktis dengan Playwright!`;
    }
    const prefix = options.moduleOrder
      ? `Modul ${String(options.moduleOrder).padStart(2, '0')}: `
      : '';
    return `Saya baru saja menyelesaikan ${prefix}${options.title} di TestingWithEkki — belajar otomasi web praktis untuk QA!`;
  }

  if (options.kind === 'track') {
    return `I just completed the ${options.title} on TestingWithEkki — practical web automation with Playwright!`;
  }
  const prefix = options.moduleOrder
    ? `Module ${String(options.moduleOrder).padStart(2, '0')}: `
    : '';
  return `I just completed ${prefix}${options.title} on TestingWithEkki — practical web automation for QA engineers!`;
}
