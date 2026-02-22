import { describe, it, expect } from 'bun:test';
import { getTutorialContent, getNextTutorial } from '@/server/content.server';

describe('Content Server - Tutorials', () => {
  describe('getTutorialContent', () => {
    it('should return tutorial content for valid slug', async () => {
      const tutorial = await getTutorialContent('test-fixtures', 'en');
      expect(tutorial).not.toBeNull();
      if (tutorial) {
        expect(tutorial.slug).toBe('test-fixtures');
        expect(tutorial.content).toBeString();
        expect(tutorial.content.length).toBeGreaterThan(0);
      }
    });

    it('should return null for invalid slug', async () => {
      const tutorial = await getTutorialContent('invalid-slug-123', 'en');
      expect(tutorial).toBeNull();
    });

    it('should fallback to English if locale content is missing', async () => {
      // Using 'xx' locale which likely doesn't exist
      const tutorial = await getTutorialContent('test-fixtures', 'xx');
      expect(tutorial).not.toBeNull();
      if (tutorial) {
        expect(tutorial.slug).toBe('test-fixtures');
        expect(tutorial.content).toBeString();
        expect(tutorial.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getNextTutorial', () => {
    it('should return next tutorial if exists', async () => {
      const next = await getNextTutorial('html-element-anatomy', 'en');
      expect(next).not.toBeNull();
      if (next) {
        expect(next.slug).toBe('dom-tree-hierarchy');
        expect(next.title).toBeString();
      }
    });

    it('should return null if no next tutorial', async () => {
      // 'advanced-fixtures' is the last one in the registry
      const next = await getNextTutorial('advanced-fixtures', 'en');
      expect(next).toBeNull();
    });
  });
});
