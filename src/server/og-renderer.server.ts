import { renderOgSvg } from '#og-layout';
import { renderOgPng } from '#og-png';
import bundledResources from './generated/og-resources.json';
import {
  getOgKey,
  normalizeOgParams,
  type OgImageInput,
} from '../lib/og-params';
import { getOgElement, getOgRenderOptions } from './og-template.server';
import type { OgResources } from './og-types';
import { OgRenderError } from './og-errors.server';

const resources: OgResources = bundledResources;
const cache = new Map<string, ArrayBuffer>();
const pending = new Map<string, Promise<ArrayBuffer>>();
const MAX_CACHE_BYTES = 2 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 8;
const MAX_PENDING_RENDERS = 4;
let renderTail: Promise<void> = Promise.resolve();
let cacheBytes = 0;

function remember(key: string, image: ArrayBuffer) {
  if (image.byteLength > MAX_CACHE_BYTES) return;
  const previous = cache.get(key);
  if (previous) {
    cacheBytes -= previous.byteLength;
    cache.delete(key);
  }
  while (
    cache.size >= MAX_CACHE_ENTRIES ||
    cacheBytes + image.byteLength > MAX_CACHE_BYTES
  ) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    const removed = cache.get(oldest);
    if (removed) cacheBytes -= removed.byteLength;
    cache.delete(oldest);
  }
  cache.set(key, image);
  cacheBytes += image.byteLength;
}

/** Arbitrary legacy queries remain dynamic; common SEO cards use Static Assets. */
export async function renderDynamicOg(
  input: OgImageInput,
): Promise<ArrayBuffer> {
  const params = normalizeOgParams(input);
  const key = getOgKey(params);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const existing = pending.get(key);
  if (existing) return existing;
  if (pending.size >= MAX_PENDING_RENDERS)
    throw new OgRenderError(
      503,
      'Image rendering is busy. Please retry shortly.',
    );
  // Font parsing, Yoga layout and rasterization share one memory budget.
  // Serialize distinct renders; coalesce duplicates and bound the waiting queue.
  const operation = renderTail.then(async () => {
    const svg = await renderOgSvg(
      getOgElement(params, resources),
      await getOgRenderOptions(resources, params),
    );
    const image = await renderOgPng(svg);
    remember(key, image);
    return image;
  });
  renderTail = operation.then(
    () => {},
    () => {},
  );
  pending.set(key, operation);
  try {
    return await operation;
  } finally {
    pending.delete(key);
  }
}
