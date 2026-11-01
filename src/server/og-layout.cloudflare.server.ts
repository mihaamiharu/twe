import satori, { init } from 'satori/standalone';
import layoutModule from 'satori/layout.wasm';
import type { ReactNode } from 'react';
import type { OgRenderOptions } from './og-types';

let initialization: Promise<void> | undefined;

// Statically compiled layout/shaping WASM works within workerd's restrictions.
// Build-time cards use the same pinned Satori version and layout engine.
export async function renderOgSvg(
  element: ReactNode,
  options: OgRenderOptions,
): Promise<string> {
  initialization ??= init(layoutModule).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  return satori(element, options);
}
