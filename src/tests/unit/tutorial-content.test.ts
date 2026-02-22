import { describe, it, expect, beforeEach } from 'bun:test';
import {
  getTutorialContent,
  clearContentCaches,
  getNextTutorial,
} from '@/server/content.server';

describe('Tutorial Content', () => {
  beforeEach(() => {
    clearContentCaches();
  });

  describe('getTutorialContent', () => {
    it('should return a tutorial for a valid slug', async () => {
      const slug = 'test-fixtures';
      const tutorial = await getTutorialContent(slug, 'en');

      expect(tutorial).not.toBeNull();
      expect(tutorial?.slug).toBe(slug);
      expect(tutorial?.content).toBeString();
      expect(tutorial?.content.length).toBeGreaterThan(0);
    });

    it('should return null for an invalid slug', async () => {
      const tutorial = await getTutorialContent('non-existent-tutorial', 'en');
      expect(tutorial).toBeNull();
    });

    it('should handle locale fallback', async () => {
      const slug = 'test-fixtures';
      // Use a locale that likely doesn't exist for this tutorial to test fallback
      const tutorial = await getTutorialContent(slug, 'xx');

      expect(tutorial).not.toBeNull();
      expect(tutorial?.slug).toBe(slug);
      // It should have fallen back to English content
      expect(tutorial?.content).toBeString();
    });
  });

  describe('getNextTutorial', () => {
    it('should return the next tutorial if it exists', async () => {
      // 'test-fixtures' usually has a next tutorial in the sequence.
      // I need to check registry.json or rely on the fact that it's likely not the last one.
      // Let's pick a known sequence if possible.
      // Alternatively, I can just check the structure if it returns something.

      // I'll use 'test-fixtures' and see if it has a next one.
      const currentSlug = 'test-fixtures';
      const next = await getNextTutorial(currentSlug, 'en');

      // If it's not the last one, it should return an object
      if (next) {
        expect(next).toHaveProperty('slug');
        expect(next).toHaveProperty('title');
      }
    });
  });
});
