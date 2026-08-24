/* eslint-disable security/detect-non-literal-fs-filename -- paths are rooted in validated repository content directories. */

/**
 * Pure filesystem-backed Learn and Practice catalog.
 *
 * This module owns editorial content only. Database persistence IDs, counts,
 * publication overlays, progress, and mutations belong to server functions
 * and are merged there by slug.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  ChallengeDefinition,
  ChallengeTier,
  LocalizedArray,
  LocalizedString,
  TutorialRegistry,
  TutorialRegistryEntry,
} from '@/lib/content.types';
import type {
  ChallengeCatalogDetail,
  ChallengeCatalogList,
  ChallengeCatalogListItem,
  TutorialCatalogDetail,
  TutorialCatalogList,
  TutorialCatalogListItem,
} from '@/lib/catalog.types';
import { getTierFromCategory } from '@/lib/constants';
import { omitUndefined } from '@/lib/omit-undefined';
import {
  parseChallengeTierJson,
  parseTutorialRegistryJson,
} from './content-validation';

const CONTENT_ROOT = process.cwd();
const TUTORIALS_DIR = join(CONTENT_ROOT, 'tutorials');
const CHALLENGES_DIR = join(CONTENT_ROOT, 'content', 'challenges');

const TIER_FILES: ChallengeTier[] = [
  'basic',
  'beginner',
  'intermediate',
  'e2e',
  'typescript',
];

type MarkdownDocument = {
  meta: { title?: string; description?: string };
  content: string;
};

function resolveLocale(value: LocalizedString, locale: string): string {
  if (locale === 'id') return value.id || value.en;
  return value.en;
}

function resolveLocaleArray(
  value: LocalizedArray | undefined,
  locale: string,
): string[] {
  if (!value) return [];
  if (locale === 'id') return value.id || value.en;
  return value.en;
}

function parseFrontmatter(content: string): MarkdownDocument {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const descriptionMatch = content.match(/^#[^\n]+\n+([^\n#]+)/);
    return {
      meta: omitUndefined({
        title: titleMatch?.[1]?.trim(),
        description: descriptionMatch?.[1]?.trim(),
      }),
      content,
    };
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  if (frontmatter === undefined || body === undefined) {
    return { meta: {}, content };
  }

  const meta: MarkdownDocument['meta'] = {};
  for (const line of frontmatter.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;

    let value = valueParts.join(':').trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }

    if (key.trim() === 'title') meta.title = value;
    if (key.trim() === 'description') meta.description = value;
  }

  return { meta, content: body.trim() };
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

async function readTutorialDocument(
  slug: string,
  locale: string,
): Promise<MarkdownDocument> {
  try {
    return parseFrontmatter(
      await readFile(join(TUTORIALS_DIR, locale, `${slug}.md`), 'utf-8'),
    );
  } catch {
    return parseFrontmatter(
      await readFile(join(TUTORIALS_DIR, 'en', `${slug}.md`), 'utf-8'),
    );
  }
}

let registryCache: TutorialRegistry | null = null;
let challengeCache: Map<string, ChallengeDefinition> | null = null;
let relationshipsValidated = false;

async function loadRegistry(): Promise<TutorialRegistry> {
  if (registryCache) return registryCache;

  const registryPath = join(TUTORIALS_DIR, 'registry.json');
  registryCache = parseTutorialRegistryJson(
    await readFile(registryPath, 'utf-8'),
    registryPath,
  );
  return registryCache;
}

async function loadAllChallenges(): Promise<Map<string, ChallengeDefinition>> {
  if (challengeCache) return challengeCache;

  const loaded = new Map<string, ChallengeDefinition>();
  for (const tier of TIER_FILES) {
    try {
      const filePath = join(CHALLENGES_DIR, `${tier}.json`);
      const tierData = parseChallengeTierJson(
        await readFile(filePath, 'utf-8'),
        filePath,
      );

      for (const challenge of tierData.challenges) {
        if (loaded.has(challenge.slug)) {
          throw new Error(`Duplicate challenge slug: ${challenge.slug}`);
        }
        loaded.set(challenge.slug, challenge);
      }
    } catch (error) {
      if (isFileNotFoundError(error)) continue;
      throw error;
    }
  }

  challengeCache = loaded;
  return loaded;
}

function assertUniqueTutorialSlugs(registry: TutorialRegistry): void {
  const seen = new Set<string>();
  for (const tutorial of registry.tutorials) {
    if (seen.has(tutorial.slug)) {
      throw new Error(`Duplicate tutorial slug: ${tutorial.slug}`);
    }
    seen.add(tutorial.slug);
  }
}

function validateRelationships(
  registry: TutorialRegistry,
  challenges: Map<string, ChallengeDefinition>,
): void {
  assertUniqueTutorialSlugs(registry);
  const tutorials = new Set(
    registry.tutorials.map((tutorial) => tutorial.slug),
  );

  for (const tutorial of registry.tutorials) {
    if (
      tutorial.nextTutorialSlug &&
      !tutorials.has(tutorial.nextTutorialSlug)
    ) {
      throw new Error(
        `Tutorial ${tutorial.slug} references missing next tutorial ${tutorial.nextTutorialSlug}`,
      );
    }

    for (const challengeSlug of tutorial.relatedChallenges ?? []) {
      if (!challenges.has(challengeSlug)) {
        throw new Error(
          `Tutorial ${tutorial.slug} references missing challenge ${challengeSlug}`,
        );
      }
    }
  }

  for (const challenge of challenges.values()) {
    if (challenge.tutorialSlug && !tutorials.has(challenge.tutorialSlug)) {
      throw new Error(
        `Challenge ${challenge.slug} references missing tutorial ${challenge.tutorialSlug}`,
      );
    }
  }
}

async function loadCatalogSources(): Promise<{
  registry: TutorialRegistry;
  challenges: Map<string, ChallengeDefinition>;
}> {
  const [registry, challenges] = await Promise.all([
    loadRegistry(),
    loadAllChallenges(),
  ]);

  if (!relationshipsValidated) {
    validateRelationships(registry, challenges);
    relationshipsValidated = true;
  }

  return { registry, challenges };
}

function sortByOrder<T extends { order: number; slug: string }>(
  items: T[],
): T[] {
  return items.sort(
    (a, b) => a.order - b.order || a.slug.localeCompare(b.slug),
  );
}

function isPublished(
  status: 'published' | 'draft' | 'coming_soon' | undefined,
): boolean {
  return !status || status === 'published';
}

async function projectTutorialSummary(
  entry: TutorialRegistryEntry,
  locale: string,
): Promise<TutorialCatalogListItem> {
  let title = entry.slug;
  let description = '';

  try {
    const document = await readTutorialDocument(entry.slug, locale);
    title = document.meta.title || entry.slug;
    description = document.meta.description || '';
  } catch {
    // A validated registry entry remains addressable even when editorial
    // metadata is incomplete; the slug is a deterministic fallback.
  }

  return {
    slug: entry.slug,
    title,
    description,
    order: entry.order,
    estimatedMinutes: entry.estimatedMinutes,
    tags: entry.tags,
    relatedChallenges: entry.relatedChallenges ?? [],
  };
}

function projectChallengeSummary(
  definition: ChallengeDefinition,
  locale: string,
): ChallengeCatalogListItem {
  return {
    slug: definition.slug,
    type: definition.type,
    difficulty: definition.difficulty,
    category: definition.category,
    xpReward: definition.xpReward,
    order: definition.order,
    title: resolveLocale(definition.title, locale),
    description: resolveLocale(definition.description, locale),
    tags: definition.tags ?? [],
    ...omitUndefined({ tutorialSlug: definition.tutorialSlug }),
  };
}

/** Load the complete localized Learn catalog from filesystem content. */
export async function getTutorialCatalogList(
  locale: string,
): Promise<TutorialCatalogList> {
  const { registry } = await loadCatalogSources();
  const summaries = await Promise.all(
    registry.tutorials
      .filter((entry) => isPublished(entry.status))
      .map((entry) => projectTutorialSummary(entry, locale)),
  );
  return sortByOrder(summaries);
}

/** Load one localized Learn item, including its markdown body. */
export async function getTutorialCatalogDetail(
  slug: string,
  locale: string,
): Promise<TutorialCatalogDetail | null> {
  const { registry } = await loadCatalogSources();
  const entry = registry.tutorials.find((tutorial) => tutorial.slug === slug);
  if (!entry || !isPublished(entry.status)) return null;

  try {
    const [summary, document] = await Promise.all([
      projectTutorialSummary(entry, locale),
      readTutorialDocument(entry.slug, locale),
    ]);
    return { ...summary, content: document.content };
  } catch (error) {
    console.error(`[ContentCatalog] Failed to load tutorial: ${slug}`, error);
    return null;
  }
}

/** Load the complete localized Practice catalog from filesystem content. */
export async function getChallengeCatalogList(
  locale: string,
): Promise<ChallengeCatalogList> {
  const { challenges } = await loadCatalogSources();
  return sortByOrder(
    [...challenges.values()]
      .filter((definition) => isPublished(definition.status))
      .map((definition) => projectChallengeSummary(definition, locale)),
  );
}

/** Load one localized Practice item, including runner/editorial detail. */
export async function getChallengeCatalogDetail(
  slug: string,
  locale: string,
): Promise<ChallengeCatalogDetail | null> {
  const { challenges } = await loadCatalogSources();
  const definition = challenges.get(slug);
  if (!definition || !isPublished(definition.status)) return null;

  return {
    ...projectChallengeSummary(definition, locale),
    instructions: resolveLocale(definition.instructions, locale),
    hints: resolveLocaleArray(definition.hints, locale),
    ...omitUndefined({
      htmlContent: definition.htmlContent,
      files: definition.files,
      editableFiles: definition.editableFiles,
      preloadModules: definition.preloadModules,
      starterCode: definition.starterCode,
    }),
    testCases: definition.testCases,
    solution: definition.solution,
  };
}

/** Return the validated, still-localized challenge definition for sync/tools. */
export async function getRawChallengeCatalogContent(
  slug: string,
): Promise<ChallengeDefinition | null> {
  const { challenges } = await loadCatalogSources();
  const definition = challenges.get(slug);
  if (!definition || !isPublished(definition.status)) return null;
  return definition;
}

type TutorialDirection = 'next' | 'previous';

/** Return an adjacent published Learn item using catalog order. */
async function getAdjacentTutorialCatalogItem(
  currentSlug: string,
  locale: string,
  direction: TutorialDirection,
): Promise<{ slug: string; title: string } | null> {
  const { registry } = await loadCatalogSources();
  const current = registry.tutorials.find(
    (tutorial) => tutorial.slug === currentSlug,
  );
  if (!current || !isPublished(current.status)) return null;

  const orderedEntries = sortByOrder(
    registry.tutorials.filter((tutorial) => isPublished(tutorial.status)),
  );
  const currentIndex = orderedEntries.findIndex(
    (tutorial) => tutorial.slug === currentSlug,
  );
  const adjacentEntry =
    direction === 'next' && current.nextTutorialSlug
      ? registry.tutorials.find(
          (tutorial) => tutorial.slug === current.nextTutorialSlug,
        )
      : orderedEntries[currentIndex + (direction === 'next' ? 1 : -1)];

  if (!adjacentEntry || !isPublished(adjacentEntry.status)) return null;
  const adjacent = await projectTutorialSummary(adjacentEntry, locale);
  return { slug: adjacent.slug, title: adjacent.title };
}

export async function getNextTutorialCatalogItem(
  currentSlug: string,
  locale: string,
): Promise<{ slug: string; title: string } | null> {
  return getAdjacentTutorialCatalogItem(currentSlug, locale, 'next');
}

/** Return the previous published Learn item in deterministic catalog order. */
export async function getPreviousTutorialCatalogItem(
  currentSlug: string,
  locale: string,
): Promise<{ slug: string; title: string } | null> {
  return getAdjacentTutorialCatalogItem(currentSlug, locale, 'previous');
}

/** Validate all declared Learn↔Practice relationships against filesystem IDs. */
export async function validateCatalogRelationships(): Promise<void> {
  await loadCatalogSources();
}

export function clearContentCatalogCaches(): void {
  registryCache = null;
  challengeCache = null;
  relationshipsValidated = false;
  tierTotalCache = null;
}

let tierTotalCache: Record<string, number> | null = null;

export async function getCachedCatalogTierTotals(): Promise<
  Record<string, number>
> {
  if (tierTotalCache) return tierTotalCache;

  const allChallenges = await getChallengeCatalogList('en');
  const totals = {
    basic: 0,
    beginner: 0,
    intermediate: 0,
    e2e: 0,
  };

  for (const challenge of allChallenges) {
    const tier = getTierFromCategory(challenge.category);
    switch (tier) {
      case 'beginner':
        totals.beginner += 1;
        break;
      case 'intermediate':
        totals.intermediate += 1;
        break;
      case 'e2e':
        totals.e2e += 1;
        break;
      default:
        totals.basic += 1;
    }
  }

  tierTotalCache = totals;
  return totals;
}

export function clearCatalogTierTotalsCache(): void {
  tierTotalCache = null;
}
