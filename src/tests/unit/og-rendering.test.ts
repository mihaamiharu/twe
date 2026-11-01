import { describe, expect, test } from 'bun:test';
import satori from 'satori';
import { normalizeOgParams } from '@/lib/og-params';
import { renderDynamicOg } from '@/server/og-renderer.server';
import { OgRenderError } from '@/server/og-errors.server';
import { getOgElement, getOgRenderOptions } from '@/server/og-template.server';
import resources from '@/server/generated/og-resources.json';

describe('OG text and rendering resource boundaries', () => {
  test('limits oversized text without splitting a joined emoji', () => {
    const emoji = '👩🏽‍💻';
    const params = normalizeOgParams({
      title: 'a'.repeat(198) + emoji.repeat(5),
      xp: 0,
    });
    expect(params.title).toBe('a'.repeat(198) + emoji.repeat(2) + '…');
    expect(params.xp).toBe('0');
    expect(normalizeOgParams({ title: '  \n ' }).title).toBe('TestingWithEkki');
  });

  test('long titles stay between the badge and rewards after actual layout', async () => {
    const params = normalizeOgParams({
      title: 'Long title '.repeat(25),
      difficulty: 'HARD',
      xp: 0,
    });
    const nodes: Array<{ text?: string; top: number; height: number }> = [];
    await satori(getOgElement(params, resources), {
      ...(await getOgRenderOptions(resources, params)),
      onNodeDetected: (node) => {
        if (node.textContent)
          nodes.push({
            text: node.textContent,
            top: node.top,
            height: node.height,
          });
      },
    });
    const title = nodes.find((node) => node.text?.startsWith('Long title'));
    const badge = nodes.find((node) => node.text === 'CHALLENGE');
    const reward = nodes.find((node) => node.text === 'HARD');
    expect(title).toBeDefined();
    expect(badge).toBeDefined();
    expect(reward).toBeDefined();
    expect(title!.top).toBeGreaterThan(badge!.top + badge!.height);
    expect(title!.top + title!.height).toBeLessThan(reward!.top);
  });

  test('coalesces duplicates, rejects excess work and recovers after a failed render', async () => {
    const run = crypto.randomUUID();
    const first = renderDynamicOg({ title: `OG queue ${run} 0` });
    const queued = [1, 2, 3].map((index) =>
      renderDynamicOg({ title: `OG queue ${run} ${index}` }),
    );
    const duplicate = renderDynamicOg({ title: `OG queue ${run} 0` });
    const excess = [4, 5, 6, 7].map((index) =>
      renderDynamicOg({ title: `OG queue ${run} ${index}` }),
    );
    const results = await Promise.allSettled([
      first,
      ...queued,
      duplicate,
      ...excess,
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(5);
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(rejected).toHaveLength(4);
    for (const result of rejected) {
      expect(result.reason).toBeInstanceOf(OgRenderError);
      expect((result.reason as OgRenderError).status).toBe(503);
    }
    expect(await duplicate).toBe(await first);
    expect(await renderDynamicOg({ title: `OG queue ${run} 0` })).toBe(
      await first,
    );
    expect(new DataView(await first).getUint32(0)).toBe(0x89504e47);
    const invalid = await Promise.allSettled([
      renderDynamicOg({ title: '\u{10ffff}' }),
    ]);
    expect(invalid[0]).toMatchObject({
      status: 'rejected',
      reason: { status: 422 },
    });
    expect(
      (await renderDynamicOg({ title: `After failure ${run}` })).byteLength,
    ).toBeGreaterThan(24);
    for (let index = 0; index < 8; index++)
      await renderDynamicOg({ title: `Eviction ${run} ${index}` });
    expect(await renderDynamicOg({ title: `OG queue ${run} 0` })).not.toBe(
      await first,
    );
  });
});
