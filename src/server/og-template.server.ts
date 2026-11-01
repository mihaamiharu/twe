import { HomeOgImageTemplate } from '../components/home-og-image-template';
import { OgImageTemplate } from '../components/og-image-template';
import type { OgImageParams } from '../lib/og-params';
import type { OgRenderOptions, OgResources } from './og-types';
import { loadOgFallbackFonts } from './og-fonts.server';

const optionsCache = new WeakMap<OgResources, OgRenderOptions>();

function decodeBase64(value: string): ArrayBuffer {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
    .buffer;
}

function baseRenderOptions(resources: OgResources): OgRenderOptions {
  const cached = optionsCache.get(resources);
  if (cached) return cached;
  const options: OgRenderOptions = {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Instrument Sans',
        data: decodeBase64(resources.boldFont),
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Instrument Sans',
        data: decodeBase64(resources.regularFont),
        weight: 400,
        style: 'normal',
      },
    ],
  };
  optionsCache.set(resources, options);
  return options;
}

export async function getOgRenderOptions(
  resources: OgResources,
  params: OgImageParams,
): Promise<OgRenderOptions> {
  const base = baseRenderOptions(resources);
  const fallback = await loadOgFallbackFonts(
    `${params.title} ${params.type} ${params.difficulty ?? ''} ${params.xp ?? ''}`,
  );
  // Keep the small Latin options stable. Fallback bytes have their own bounded
  // cache; the workerd adapter also bounds retained Satori font loaders.
  return fallback.length
    ? { ...base, fonts: [...base.fonts, ...fallback] }
    : base;
}

export function getOgElement(params: OgImageParams, resources: OgResources) {
  if (params.type !== 'Home') return OgImageTemplate(params);
  if (!resources.inspectorImage)
    throw new Error('Home OG cards require the build-time illustration.');
  return HomeOgImageTemplate({ inspectorImage: resources.inspectorImage });
}
