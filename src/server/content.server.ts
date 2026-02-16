/**
 * Content Server - Filesystem-Driven Content Loader
 *
 * This service loads tutorials and challenges directly from the filesystem,
 * making the repository the single source of truth for content.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  Tutorial,
  TutorialRegistry,
  TutorialRegistryEntry,
  Challenge,
  ChallengeDefinition,
  ChallengeTierFile,
  ChallengeFilters,
  ChallengeTier,
  LocalizedString,
  LocalizedArray,
} from '@/lib/content.types';

// =============================================================================
// HELPERS
// =============================================================================

const CONTENT_ROOT = process.cwd();
const TUTORIALS_DIR = join(CONTENT_ROOT, 'tutorials');
const CHALLENGES_DIR = join(CONTENT_ROOT, 'content', 'challenges');

/**
 * Resolve a localized string to the requested locale with fallback to English
 */
function resolveLocale(value: LocalizedString, locale: string): string {
  return value[locale as keyof LocalizedString] || value.en || '';
}

/**
 * Resolve a localized array to the requested locale with fallback to English
 */
function resolveLocaleArray(
  value: LocalizedArray | undefined,
  locale: string,
): string[] {
  if (!value) return [];
  return value[locale as keyof LocalizedArray] || value.en || [];
}

/**
 * Parse frontmatter from markdown content
 * Returns { title, description } and the content without frontmatter
 */
function parseFrontmatter(content: string): {
  meta: { title?: string; description?: string };
  content: string;
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    // No frontmatter, extract title from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const descMatch = content.match(/^#[^\n]+\n+([^\n#]+)/);
    return {
      meta: {
        title: titleMatch?.[1]?.trim(),
        description: descMatch?.[1]?.trim(),
      },
      content,
    };
  }

  const [, frontmatter, body] = frontmatterMatch;
  const meta: { title?: string; description?: string } = {};

  for (const line of frontmatter.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;

    let value = valueParts.join(':').trim();

    // Strip quotes if present7899
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

// =============================================================================
// TUTORIAL LOADING
// =============================================================================

let registryCache: TutorialRegistry | null = null;

/**
 * Load the tutorial registry (cached)
 */
async function loadRegistry(): Promise<TutorialRegistry> {
  if (registryCache) return registryCache;

  const registryPath = join(TUTORIALS_DIR, 'registry.json');
  const content = await readFile(registryPath, 'utf-8');
  registryCache = JSON.parse(content) as TutorialRegistry;
  return registryCache;
}

/**
 * Load a single tutorial by slug and locale
 */
export async function getTutorialContent(
  slug: string,
  locale: string,
): Promise<Tutorial | null> {
  try {
    const registry = await loadRegistry();
    const entry = registry.tutorials.find((t) => t.slug === slug);

    if (!entry) return null;

    // Block access to non-published content
    if (entry.status && entry.status !== 'published') return null;

    // Try requested locale first, then fallback to 'en'
    let content: string;
    let usedLocale = locale;

    try {
      const filePath = join(TUTORIALS_DIR, locale, `${slug}.md`);
      content = await readFile(filePath, 'utf-8');
    } catch {
      // Fallback to English
      usedLocale = 'en';
      const filePath = join(TUTORIALS_DIR, 'en', `${slug}.md`);
      content = await readFile(filePath, 'utf-8');
    }

    const { meta, content: markdownContent } = parseFrontmatter(content);

    return {
      slug: entry.slug,
      title: meta.title || slug,
      description: meta.description || '',
      content: markdownContent,
      order: entry.order,
      estimatedMinutes: entry.estimatedMinutes,
      tags: entry.tags,
      relatedChallenges: entry.relatedChallenges,
    };
  } catch (error) {
    console.error(`[ContentService] Failed to load tutorial: ${slug}`, error);
    return null;
  }
}

/**
 * Get all tutorials from the registry (metadata only, no content)
 */
export async function getTutorialList(
  locale: string,
): Promise<Omit<Tutorial, 'content'>[]> {
  const registry = await loadRegistry();

  const tutorialPromises = registry.tutorials.map(async (entry) => {
    // Skip non-published content (default to published if no status)
    if (entry.status && entry.status !== 'published') return null;

    // Try to load frontmatter for title/description
    let title = entry.slug;
    let description = '';

    try {
      const filePath = join(TUTORIALS_DIR, locale, `${entry.slug}.md`);
      const content = await readFile(filePath, 'utf-8');
      const { meta } = parseFrontmatter(content);
      title = meta.title || entry.slug;
      description = meta.description || '';
    } catch {
      // Fallback to English
      try {
        const filePath = join(TUTORIALS_DIR, 'en', `${entry.slug}.md`);
        const content = await readFile(filePath, 'utf-8');
        const { meta } = parseFrontmatter(content);
        title = meta.title || entry.slug;
        description = meta.description || '';
      } catch {
        // Use slug as fallback
      }
    }

    return {
      slug: entry.slug,
      title,
      description,
      order: entry.order,
      estimatedMinutes: entry.estimatedMinutes,
      tags: entry.tags,
      relatedChallenges: entry.relatedChallenges,
    };
  });

  const results = await Promise.all(tutorialPromises);

  const tutorials = results.filter(
    (t): t is Omit<Tutorial, 'content'> => t !== null,
  );

  return tutorials.sort((a, b) => a.order - b.order);
}

/**
 * Get the next tutorial for a given slug (efficient O(1) lookup using registry)
 */
export async function getNextTutorial(
  currentSlug: string,
  locale: string,
): Promise<{ slug: string; title: string } | null> {
  const registry = await loadRegistry();
  const current = registry.tutorials.find((t) => t.slug === currentSlug);

  if (!current?.nextTutorialSlug) return null;

  const nextEntry = registry.tutorials.find(
    (t) => t.slug === current.nextTutorialSlug,
  );
  if (!nextEntry) return null;

  // Load just the title from frontmatter
  let title = nextEntry.slug;
  try {
    const filePath = join(TUTORIALS_DIR, locale, `${nextEntry.slug}.md`);
    const content = await readFile(filePath, 'utf-8');
    const { meta } = parseFrontmatter(content);
    title = meta.title || nextEntry.slug;
  } catch {
    try {
      const filePath = join(TUTORIALS_DIR, 'en', `${nextEntry.slug}.md`);
      const content = await readFile(filePath, 'utf-8');
      const { meta } = parseFrontmatter(content);
      title = meta.title || nextEntry.slug;
    } catch {
      // Use slug as fallback
    }
  }

  return { slug: nextEntry.slug, title };
}

// =============================================================================
// CHALLENGE LOADING
// =============================================================================

const TIER_FILES: ChallengeTier[] = [
  'basic',
  'beginner',
  'intermediate',
  'e2e',
  'typescript',
];
let challengeCache: Map<string, ChallengeDefinition> = new Map();
let challengeCacheLoaded = false;

/**
 * Load all challenges from tier JSON files (cached)
 */
async function loadAllChallenges(): Promise<Map<string, ChallengeDefinition>> {
  if (challengeCacheLoaded) return challengeCache;

  for (const tier of TIER_FILES) {
    try {
      const filePath = join(CHALLENGES_DIR, `${tier}.json`);
      const content = await readFile(filePath, 'utf-8');
      const tierData = JSON.parse(content) as ChallengeTierFile;

      for (const challenge of tierData.challenges) {
        challengeCache.set(challenge.slug, challenge);
      }
    } catch {
      // Tier file doesn't exist yet, skip
      console.log(
        `[ContentService] Tier file ${tier}.json not found, skipping`,
      );
    }
  }

  challengeCacheLoaded = true;
  return challengeCache;
}

/**
 * Get a single challenge by slug
 */
export async function getChallengeContent(
  slug: string,
  locale: string,
): Promise<Challenge | null> {
  const challenges = await loadAllChallenges();
  const def = challenges.get(slug);

  if (!def) return null;

  // Block access to non-published content
  if (def.status && def.status !== 'published') return null;

  return {
    slug: def.slug,
    type: def.type,
    difficulty: def.difficulty,
    category: def.category,
    xpReward: def.xpReward,
    order: def.order,
    tutorialSlug: def.tutorialSlug,
    title: resolveLocale(def.title, locale),
    description: resolveLocale(def.description, locale),
    instructions: resolveLocale(def.instructions, locale),
    hints: resolveLocaleArray(def.hints, locale),
    htmlContent: def.htmlContent,
    files: def.files,
    editableFiles: def.editableFiles,
    preloadModules: def.preloadModules,
    starterCode: def.starterCode,
    testCases: def.testCases,
    solution: def.solution,
    tags: def.tags,
  };
}

/**
 * Get raw challenge definition (including localized objects)
 */
export async function getRawChallengeContent(
  slug: string,
): Promise<ChallengeDefinition | null> {
  const challenges = await loadAllChallenges();
  const def = challenges.get(slug);

  if (!def) return null;

  // Block access to non-published content
  if (def.status && def.status !== 'published') return null;

  return def;
}

/**
 * Get filtered challenge list
 */
export async function getChallengeList(
  locale: string,
  filters?: ChallengeFilters,
): Promise<Omit<Challenge, 'testCases' | 'solution'>[]> {
  const challenges = await loadAllChallenges();
  const results: Omit<Challenge, 'testCases' | 'solution'>[] = [];

  for (const def of challenges.values()) {
    // Skip non-published content (default to published if no status)
    if (def.status && def.status !== 'published') continue;

    // Apply filters
    if (filters?.type && def.type !== filters.type) continue;
    if (filters?.difficulty && def.difficulty !== filters.difficulty) continue;
    if (filters?.category && def.category !== filters.category) continue;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = resolveLocale(def.title, locale)
        .toLowerCase()
        .includes(searchLower);
      const descMatch = resolveLocale(def.description, locale)
        .toLowerCase()
        .includes(searchLower);
      if (!titleMatch && !descMatch) continue;
    }

    results.push({
      slug: def.slug,
      type: def.type,
      difficulty: def.difficulty,
      category: def.category,
      xpReward: def.xpReward,
      order: def.order,
      tutorialSlug: def.tutorialSlug,
      title: resolveLocale(def.title, locale),
      description: resolveLocale(def.description, locale),
      instructions: resolveLocale(def.instructions, locale),
      htmlContent: def.htmlContent,
      files: def.files,
      editableFiles: def.editableFiles,
      preloadModules: def.preloadModules,
      starterCode: def.starterCode,
      tags: def.tags,
    });
  }

  return results.sort((a, b) => a.order - b.order);
}

// =============================================================================
// CACHE & STATS
// =============================================================================

let tierTotalCache: Record<string, number> | null = null;
import { getTierFromCategory } from '@/lib/constants';

/**
 * Clear caches (useful for development/hot reload)
 */
export function clearContentCaches(): void {
  registryCache = null;
  challengeCache = new Map();
  challengeCacheLoaded = false;
  tierTotalCache = null;
}

/**
 * Get cached tier totals (fixes #3: avoids recalculating on every request)
 */
export async function getCachedTierTotals(): Promise<Record<string, number>> {
  if (tierTotalCache) return tierTotalCache;

  const allChallenges = await getChallengeList('en');
  const totals: Record<string, number> = {
    basic: 0,
    beginner: 0,
    intermediate: 0,
    e2e: 0,
  };

  allChallenges.forEach((c) => {
    const tier = getTierFromCategory(c.category || undefined);
    if (totals[tier] !== undefined) {
      totals[tier]++;
    } else {
      totals['basic'] = (totals['basic'] || 0) + 1;
    }
  });

  tierTotalCache = totals;
  return totals;
}
