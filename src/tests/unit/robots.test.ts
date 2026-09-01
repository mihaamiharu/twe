import { describe, expect, test } from 'bun:test';
import { getRobotsTxt } from '@/lib/robots';

describe('robots.txt policy', () => {
  test('blocks the QA host completely', () => {
    expect(getRobotsTxt('qa.testingwithekki.com')).toBe(`User-agent: *
Disallow: /`);
  });

  test('allows search/reference retrieval while blocking training crawlers', () => {
    const robots = getRobotsTxt('testingwithekki.com');

    expect(robots).toContain('User-agent: *\nAllow: /');
    expect(robots).toContain('User-agent: GPTBot\nDisallow: /');
    expect(robots).toContain('User-agent: ClaudeBot\nDisallow: /');
    expect(robots).toContain('User-agent: Google-Extended\nDisallow: /');
    expect(robots).toContain('User-agent: OAI-SearchBot\nAllow: /');
    expect(robots).toContain(
      'User-agent: OAI-SearchBot\nAllow: /\nDisallow: /admin/\nDisallow: /api/',
    );
    expect(robots).toContain(
      'Sitemap: https://testingwithekki.com/sitemap.xml',
    );
    expect(robots).not.toContain('OAI-AdsBot');
  });
});
