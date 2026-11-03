import satori from 'satori';
import type { ReactNode } from 'react';
import type { OgRenderOptions } from './og-types';

export function renderOgSvg(
  element: ReactNode,
  options: OgRenderOptions,
): Promise<string> {
  return satori(element, options);
}
