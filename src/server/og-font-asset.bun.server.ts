/* eslint-disable security/detect-non-literal-fs-filename -- Only generated SHA-256 font asset names beneath the fixed public directory. */
import { readFile } from 'node:fs/promises';

export async function readOgFontAsset(path: string): Promise<ArrayBuffer> {
  if (!/^\/og-fonts\/[a-f0-9]{64}\.woff$/.test(path))
    throw new Error('Invalid generated OG font path.');
  return new Uint8Array(
    await readFile(new URL(`../../public${path}`, import.meta.url)),
  ).buffer;
}
