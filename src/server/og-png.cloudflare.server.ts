import { initWasm, Resvg } from '@resvg/resvg-wasm';
import wasmModule from '@resvg/resvg-wasm/index_bg.wasm';

let initialization: Promise<void> | undefined;

export async function renderOgPng(svg: string): Promise<ArrayBuffer> {
  initialization ??= initWasm(wasmModule).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  const renderer = new Resvg(svg, { font: { loadSystemFonts: false } });
  try {
    const image = renderer.render();
    try {
      return new Uint8Array(image.asPng()).buffer;
    } finally {
      image.free();
    }
  } finally {
    renderer.free();
  }
}
