import type { Plugin } from 'vite';

/** Compatibility for the exact pinned Satori 0.63.2 standalone bundle. */
export function adaptSatoriForWorkerd(source: string): string {
  const replaceOnce = (before: string, after: string) => {
    if (source.split(before).length !== 2)
      throw new Error(
        'Pinned Satori workerd adapter no longer matches; review the renderer upgrade.',
      );
    source = source.replace(before, after);
  };
  // The bundled HarfBuzz Emscripten loader assumes browser worker location and
  // compiles WASM bytes by default. Workerd needs a statically imported module.
  replaceOnce('B&&(A=self.location.href)', 'B&&(A=self.location?.href||"")');
  replaceOnce(
    'cf().then(e=>{A(af(e))},g)',
    'cf({instantiateWasm(imports,receive){const instance=new WebAssembly.Instance(tweHarfBuzzModule,imports);receive(instance,tweHarfBuzzModule);return instance.exports;}}).then(e=>{A(af(e))},g)',
  );
  // Parsed fonts and shaped runs are sizeable. Retain two loader combinations
  // rather than the upstream eight in the single 128 MB application isolate.
  replaceOnce('UG=0,bG=8,dB=new Map', 'UG=0,bG=2,dB=new Map');
  replaceOnce('var uf=256;function df', 'var uf=32;function df');
  return 'import tweHarfBuzzModule from "harfbuzzjs/hb.wasm";\n' + source;
}

export function satoriWorkerdPlugin(): Plugin {
  return {
    name: 'twe-satori-workerd',
    enforce: 'pre',
    transform(source, id, options) {
      if (
        !options?.ssr ||
        !id.replaceAll('\\', '/').endsWith('/satori/dist/standalone.js')
      )
        return;
      return { code: adaptSatoriForWorkerd(source), map: null };
    },
  };
}
