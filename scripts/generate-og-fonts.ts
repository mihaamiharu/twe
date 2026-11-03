/* eslint-disable security/detect-non-literal-fs-filename -- Paths are fixed package inputs and SHA-256 asset names, never request data. */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageResolve = createRequire(join(root, 'package.json')).resolve;
const sources = [
  ['@fontsource/noto-sans', 700],
  ['@fontsource/noto-sans-arabic', 700],
  ['@fontsource/noto-sans-jp', 700],
  ['@fontsource/noto-emoji', 400],
] as const;
export const ogFontSourceFiles = sources.flatMap(([name, weight]) => [
  packageResolve(`${name}/${weight}.css`),
  packageResolve(`${name}/LICENSE`),
]);

export async function generateOgFonts() {
  const output = join(root, 'public/og-fonts');
  await mkdir(output, { recursive: true });
  const fonts: Array<{
    name: string;
    path: string;
    bytes: number;
    weight: 400 | 700;
    ranges: [number, number][];
  }> = [];
  for (const [name, weight] of sources) {
    const cssPath = packageResolve(`${name}/${weight}.css`);
    const css = await readFile(cssPath, 'utf8');
    await writeFile(
      join(output, `${name.slice('@fontsource/'.length)}-LICENSE.txt`),
      await readFile(packageResolve(`${name}/LICENSE`)),
    );
    for (const match of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
      const block = match[1]!;
      const relativePath = block.match(
        /url\((\.\/files\/[a-z0-9-]+\.woff)\)/,
      )?.[1];
      const unicode = block.match(/unicode-range:\s*([^;]+);/)?.[1];
      if (!relativePath || !unicode)
        throw new Error('OG font CSS is incomplete.');
      const bytes = await readFile(resolve(dirname(cssPath), relativePath));
      if (bytes.length > 512 * 1024)
        throw new Error('OG font subset exceeds its budget.');
      const hash = createHash('sha256').update(bytes).digest('hex');
      const path = `/og-fonts/${hash}.woff`;
      try {
        await access(join(root, 'public', path));
      } catch {
        await writeFile(join(root, 'public', path), bytes);
      }
      fonts.push({
        name: `TWE fallback ${fonts.length}`,
        path,
        bytes: bytes.length,
        weight,
        ranges: unicode.split(',').map((range): [number, number] => {
          const [start, end] = range.trim().replace(/^U\+/i, '').split('-');
          const low = Number.parseInt(start!, 16);
          const high = end ? Number.parseInt(end, 16) : low;
          if (
            !Number.isSafeInteger(low) ||
            !Number.isSafeInteger(high) ||
            high < low
          )
            throw new Error('Invalid OG font Unicode range.');
          return [low, high];
        }),
      });
    }
  }
  const manifestPath = join(root, 'src/server/generated/og-fonts.json');
  const text = JSON.stringify(fonts) + '\n';
  let existing = '';
  try {
    existing = await readFile(manifestPath, 'utf8');
  } catch {
    /* First generation. */
  }
  if (existing !== text) await writeFile(manifestPath, text);
  return fonts;
}

if (import.meta.main)
  console.log(
    `Prepared ${(await generateOgFonts()).length} self-hosted OG font subsets.`,
  );
