import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { generateOgAssets, ogSourceFiles } from './generate-og-assets';
import { isContentSource } from './content-manifest.plugin';
import { contentSourceDirectories } from './generate-content-manifest';

export function ogAssetsPlugin(): Plugin {
  const watched = new Set(ogSourceFiles.map((file) => resolve(file)));
  let prepared: Awaited<ReturnType<typeof generateOgAssets>> | undefined;
  const prepare = async () => {
    prepared = await generateOgAssets();
    for (const file of prepared.sourceFiles) watched.add(resolve(file));
    return prepared;
  };
  return {
    name: 'twe-og-assets',
    async config(_config, environment) {
      // Finish before Vite copies public/ into the client output. A preview
      // serves an existing build and must not regenerate source assets.
      if (!environment.isPreview) await prepare();
    },
    async buildStart() {
      const result = prepared ?? (await prepare());
      for (const file of result.sourceFiles) {
        this.addWatchFile(file);
        watched.add(resolve(file));
      }
    },
    watchChange(file) {
      if (watched.has(resolve(file)) || isContentSource(file))
        prepared = undefined;
    },
    configureServer(server) {
      let queue = Promise.resolve();
      const refresh = (event: string, file: string) => {
        if (
          !['add', 'change', 'unlink'].includes(event) ||
          (!watched.has(resolve(file)) && !isContentSource(file))
        )
          return;
        queue = queue
          .then(async () => {
            await prepare();
          })
          .catch((error: unknown) => {
            server.config.logger.error(
              error instanceof Error ? error.message : 'OG generation failed.',
            );
          });
      };
      server.watcher.add([...contentSourceDirectories, ...ogSourceFiles]);
      server.watcher.on('all', refresh);
      server.httpServer?.once('close', () =>
        server.watcher.off('all', refresh),
      );
    },
  };
}
