import { describe, it, expect } from 'bun:test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  getChallengeContent,
  getChallengeList,
  getTutorialList,
} from '@/server/content.server';
import {
  parseChallengeTierJson,
  parseTutorialRegistryJson,
} from '@/server/content-validation';
import type { ChallengeTier } from '@/lib/content.types';

describe('Content Server', () => {
  describe('getTutorialList', () => {
    it('should return a list of tutorials', async () => {
      const tutorials = await getTutorialList('en');
      expect(tutorials).toBeArray();
      expect(tutorials.length).toBeGreaterThan(0);

      const first = tutorials[0];
      expect(first).toHaveProperty('slug');
      expect(first).toHaveProperty('title');
      expect(first).toHaveProperty('description');
      expect(first).toHaveProperty('order');

      // Verify sorting
      for (let i = 0; i < tutorials.length - 1; i++) {
        expect(tutorials[i].order).toBeLessThanOrEqual(tutorials[i + 1].order);
      }
    });
  });

  it('uses the same localized projection for challenge lists and details', async () => {
    const challenges = await getChallengeList('en');
    const summary = challenges[0];
    expect(summary).toBeDefined();
    if (!summary) throw new Error('Expected at least one challenge');

    const detail = await getChallengeContent(summary.slug, 'en');
    expect(detail).not.toBeNull();
    expect(detail).toMatchObject(summary);
  });

  it('validates the real tutorial registry and active challenge tiers', async () => {
    const registryPath = join(process.cwd(), 'tutorials', 'registry.json');
    const registry = parseTutorialRegistryJson(
      await readFile(registryPath, 'utf8'),
      registryPath,
    );
    expect(registry.tutorials.length).toBeGreaterThan(0);

    const tiers: ChallengeTier[] = [
      'basic',
      'beginner',
      'intermediate',
      'e2e',
      'typescript',
    ];
    for (const tier of tiers) {
      const tierPath = join(process.cwd(), 'content', 'challenges', `${tier}.json`);
      const parsed = parseChallengeTierJson(
        await readFile(tierPath, 'utf8'),
        tierPath,
      );
      expect(parsed.tier).toBe(tier);
      expect(parsed.challenges.length).toBeGreaterThan(0);
    }
  });

  it('reports malformed JSON with its source path', () => {
    expect(() => parseTutorialRegistryJson('{', 'tutorials/broken.json'))
      .toThrow(/Invalid JSON in tutorials\/broken\.json/);
  });

  it('reports invalid content with an actionable property path', () => {
    expect(() => parseChallengeTierJson(
      JSON.stringify({
        tier: 'basic',
        challenges: [{ slug: 'missing-required-fields' }],
      }),
      'content/challenges/broken.json',
    )).toThrow(/content\/challenges\/broken\.json.*challenges\.0\.solution/);
  });

  it('preserves absent optional properties in validated JSON content', () => {
    const registry = parseTutorialRegistryJson(JSON.stringify({
      tutorials: [{
        slug: 'intro',
        order: 1,
        estimatedMinutes: 5,
        tags: [],
      }],
    }), 'tutorials/test-registry.json');
    expect('relatedChallenges' in registry.tutorials[0]).toBe(false);
    expect('nextTutorialSlug' in registry.tutorials[0]).toBe(false);
    expect('status' in registry.tutorials[0]).toBe(false);

    const tier = parseChallengeTierJson(JSON.stringify({
      tier: 'basic',
      challenges: [{
        slug: 'minimal',
        type: 'JAVASCRIPT',
        difficulty: 'EASY',
        category: 'javascript',
        xpReward: 10,
        order: 1,
        title: { en: 'Minimal' },
        description: { en: 'Minimal challenge' },
        instructions: { en: 'Return true' },
        testCases: [],
        solution: 'return true;',
      }],
    }), 'content/challenges/test-tier.json');
    const challenge = tier.challenges[0];
    expect('tutorialSlug' in challenge).toBe(false);
    expect('htmlContent' in challenge).toBe(false);
    expect('id' in challenge.title).toBe(false);
  });
});
