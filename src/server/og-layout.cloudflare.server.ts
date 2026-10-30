import { satori } from '@cf-wasm/satori/workerd';
import type { ReactNode } from 'react';
import type { OgRenderOptions } from './og-types';

// The workerd entry statically imports Yoga WASM rather than compiling bytes.
// Its renderer version differs from the legacy Bun renderer; visual QA is pending.
export function renderOgSvg(
  element: ReactNode,
  options: OgRenderOptions,
): Promise<string> {
  return satori(element, options);
}
