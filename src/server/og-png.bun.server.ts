import { Resvg } from '@resvg/resvg-js';

export function renderOgPng(svg: string): Promise<ArrayBuffer> {
  const renderer = new Resvg(svg, { font: { loadSystemFonts: false } });
  return Promise.resolve(new Uint8Array(renderer.render().asPng()).buffer);
}
