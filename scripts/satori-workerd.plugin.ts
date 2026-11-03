import type { Plugin } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The pinned HarfBuzz wrapper registers these JS callbacks in its WASM table.
// Workerd requires the tiny conversion modules to be compiled on deployment.
const callbackSignatures = [
  'iiiii',
  'ippiip',
  'ippiipp',
  'ippip',
  'ippipip',
  'ippipp',
  'ippippp',
  'ipppipp',
  'ipppp',
  'vi',
  'viiiffffffi',
  'viiiffffi',
  'viiiffi',
  'viiii',
] as const;

export function harfBuzzCallbackModule(
  signature: string,
): Uint8Array<ArrayBuffer> {
  if (!callbackSignatures.some((known) => known === signature))
    throw new Error('Unsupported pinned HarfBuzz callback signature.');
  const types = new Map([
    ['i', 0x7f],
    ['p', 0x7f],
    ['f', 0x7d],
  ]);
  const parameters = [...signature.slice(1)].map((type) => types.get(type)!);
  const results = signature[0] === 'v' ? [] : [types.get(signature[0]!)!];
  const typeSection = [
    1,
    0x60,
    parameters.length,
    ...parameters,
    results.length,
    ...results,
  ];
  return Uint8Array.from([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    1,
    typeSection.length,
    ...typeSection,
    2,
    7,
    1,
    1,
    101,
    1,
    102,
    0,
    0,
    7,
    5,
    1,
    1,
    102,
    0,
    0,
  ]);
}

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
    'cf({instantiateWasm(imports,receive){const instance=new WebAssembly.Instance(tweHarfBuzzModule,imports);receive(instance,tweHarfBuzzModule);return instance.exports;}}).then(e=>{try{A(af(e))}catch(error){g(error)}},g)',
  );
  // Emscripten also compiles tiny JS-to-WASM callback wrappers. Precompile
  // every signature used by the pinned wrapper instead of generating code live.
  replaceOnce(
    'VA=new WebAssembly.Module(kA)',
    'VA=tweHarfBuzzCallbacks[BA]??(()=>{throw new Error("Unsupported HarfBuzz callback signature")})()',
  );
  const directory = resolve('node_modules/.cache/twe-og-wasm');
  mkdirSync(directory, { recursive: true });
  const imports = callbackSignatures.map((signature, index) => {
    const path = resolve(directory, `${signature}.wasm`);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed signatures and local build-cache directory; no request input.
    writeFileSync(path, harfBuzzCallbackModule(signature));
    return `import tweCallback${index} from ${JSON.stringify(path)};`;
  });
  const callbacks = callbackSignatures
    .map(
      (signature, index) => `${JSON.stringify(signature)}:tweCallback${index}`,
    )
    .join(',');
  // Parsed fonts and shaped runs are sizeable. Retain two loader combinations
  // rather than the upstream eight in the single 128 MB application isolate.
  replaceOnce('UG=0,bG=8,dB=new Map', 'UG=0,bG=2,dB=new Map');
  replaceOnce('var uf=256;function df', 'var uf=32;function df');
  return (
    'import tweHarfBuzzModule from "harfbuzzjs/hb.wasm";\n' +
    imports.join('\n') +
    `\nconst tweHarfBuzzCallbacks={${callbacks}};\n` +
    source
  );
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
