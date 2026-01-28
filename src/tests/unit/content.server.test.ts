import { describe, it, expect } from 'bun:test';
import { getTutorialList } from '@/server/content.server';

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
});
