import catalog from './generated/og-catalog.json';
import { getLegacyOgPath, getOgKey, type OgImageInput } from './og-params';

// This small public manifest contains only published card keys and asset paths.
// Font bytes, image data and challenge solutions stay out of this module.
const paths = new Map<string, string>(Object.entries(catalog.paths));

export function getStaticOgPath(input: OgImageInput): string | undefined {
  return paths.get(getOgKey(input));
}

export function getOgImagePath(input: OgImageInput): string {
  return getStaticOgPath(input) ?? getLegacyOgPath(input);
}
