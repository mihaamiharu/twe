import { readOgFontAsset } from '#og-font-asset';
import manifest from './generated/og-fonts.json';
import type { OgRenderOptions } from './og-types';
import { OgRenderError } from './og-errors.server';

type Font = OgRenderOptions['fonts'][number];
const binaryCache = new Map<string, ArrayBuffer>();
const MAX_BINARY_CACHE_BYTES = 256 * 1024;
const MAX_RENDER_FONT_BYTES = 512 * 1024;
const MAX_RENDER_FONTS = 12;
let binaryCacheBytes = 0;

async function loadFont(path: string, expectedBytes: number) {
  const cached = binaryCache.get(path);
  if (cached) {
    binaryCache.delete(path);
    binaryCache.set(path, cached);
    return cached;
  }
  const data = await readOgFontAsset(path);
  if (data.byteLength !== expectedBytes)
    throw new Error('OG font asset size differs.');
  if (data.byteLength <= MAX_BINARY_CACHE_BYTES) {
    while (binaryCacheBytes + data.byteLength > MAX_BINARY_CACHE_BYTES) {
      const oldest = binaryCache.keys().next().value;
      if (oldest === undefined) break;
      binaryCacheBytes -= binaryCache.get(oldest)!.byteLength;
      binaryCache.delete(oldest);
    }
    binaryCache.set(path, data);
    binaryCacheBytes += data.byteLength;
  }
  return data;
}

/** Load only the self-hosted Unicode subsets used by this bounded title. */
export async function loadOgFallbackFonts(text: string): Promise<Font[]> {
  const selected = new Set<(typeof manifest)[number]>();
  for (const character of text) {
    const point = character.codePointAt(0)!;
    // Latin is bundled. Joiners/variation selectors belong to their grapheme's
    // font and must not select another subset independently.
    if (point <= 0xff || /\p{Default_Ignorable_Code_Point}/u.test(character))
      continue;
    const font = manifest.find((entry) =>
      entry.ranges.some(
        ([low, high]) =>
          low !== undefined &&
          high !== undefined &&
          point >= low &&
          point <= high,
      ),
    );
    if (!font)
      throw new OgRenderError(
        422,
        'This title contains unsupported characters.',
      );
    selected.add(font);
  }
  if (
    selected.size > MAX_RENDER_FONTS ||
    [...selected].reduce((total, font) => total + font.bytes, 0) >
      MAX_RENDER_FONT_BYTES
  )
    throw new OgRenderError(
      422,
      'This title is too complex to render. Try a shorter title.',
    );
  const result: Font[] = [];
  // Sequential loads also bound transient asset-response buffers.
  for (const font of selected)
    result.push({
      name: font.name,
      weight: font.weight === 400 ? 400 : 700,
      style: 'normal',
      data: await loadFont(font.path, font.bytes),
    });
  return result;
}
