import type { Plugin } from 'vite';
import { relative, isAbsolute } from 'node:path';
import {
  contentSourceDirectories,
  generateContentManifest,
} from './generate-content-manifest';

export function isContentSource(file: string) {
  return contentSourceDirectories.some((directory) => {
    const path = relative(directory, file);
    return (
      path !== '' &&
      path !== '..' &&
      !path.startsWith('../') &&
      !path.startsWith('..\\') &&
      !isAbsolute(path)
    );
  });
}

export function contentManifestPlugin(): Plugin {
  return {
    name: 'twe-bundled-content',
    async buildStart() {
      const result = await generateContentManifest();
      for (const file of result.sourceFiles) this.addWatchFile(file);
    },
    configureServer(server) {
      server.watcher.add(contentSourceDirectories);
      let generation = Promise.resolve();
      const refresh = (event: string, file: string) => {
        if (
          !['add', 'change', 'unlink'].includes(event) ||
          !isContentSource(file)
        )
          return;
        // Serialize writes when editors save several locale/source files together.
        generation = generation
          .then(async () => {
            await generateContentManifest();
          })
          .catch((error: unknown) => {
            server.config.logger.error(
              error instanceof Error
                ? error.message
                : 'Content snapshot generation failed.',
            );
          });
      };
      server.watcher.on('all', refresh);
      server.httpServer?.once('close', () =>
        server.watcher.off('all', refresh),
      );
    },
  };
}
