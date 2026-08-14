import { describe, it, expect } from 'bun:test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getTutorialList } from '@/server/content.server';
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
});
