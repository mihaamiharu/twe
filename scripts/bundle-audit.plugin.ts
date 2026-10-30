import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export function bundleAuditPlugin(): Plugin {
  return {
    name: 'twe-bundle-boundaries',
    apply: 'build',
    async generateBundle(_options, bundle) {
      const name = this.environment.name;
      if (name !== 'client' && name !== 'ssr') return;
      const removedBrowserWorkers: string[] = [];
      if (name === 'ssr') {
        const chunks = Object.values(bundle).filter(
          (output) => output.type === 'chunk',
        );
        if (
          !chunks.some(
            (chunk) => chunk.isEntry && chunk.exports.includes('AppRuntime'),
          )
        )
          this.error(
            'The Worker entry must export the SQLite AppRuntime class.',
          );
        for (const [fileName, output] of Object.entries(bundle)) {
          // Vite may emit browser Worker assets while scanning modules that
          // ClientOnly later removes. Keep those scripts in client Static Assets.
          if (
            output.type !== 'asset' ||
            !/(?:^|\/)(?:ts|css|html|json|editor)\.worker-[\w-]+\.js(?:\.map)?$/.test(
              fileName,
            )
          )
            continue;
          const scriptName = fileName.replace(/\.map$/, '');
          if (
            chunks.some(
              (chunk) =>
                chunk.code.includes(scriptName) ||
                chunk.code.includes(scriptName.split('/').at(-1) ?? scriptName),
            )
          )
            this.error(
              `Browser worker is unexpectedly referenced by SSR: ${fileName}`,
            );
          Reflect.deleteProperty(bundle, fileName);
          removedBrowserWorkers.push(fileName);
        }
      }
      const root = resolve(import.meta.dirname, '..').replaceAll('\\', '/');
      const modules = [
        ...new Set(
          Object.values(bundle).flatMap((output) =>
            output.type === 'chunk'
              ? Object.entries(output.modules)
                  .filter(([, info]) => info.renderedLength > 0)
                  .map(([id]) =>
                    id.replaceAll('\\', '/').replace(`${root}/`, ''),
                  )
              : [],
          ),
        ),
      ].sort();
      const forbidden =
        name === 'client'
          ? [
              /src\/server\/generated\//,
              /src\/server\/[^?]+\.server\.ts/,
              /src\/db\//,
              /src\/runtime\/platform\.local/,
              /node_modules\/wrangler\//,
            ]
          : [
              /src\/runtime\/platform\.local/,
              /src\/db\/legacy\//,
              /og-(?:png|layout)\.bun\.server/,
              /node_modules\/@resvg\/resvg-js\//,
              /node_modules\/postgres\//,
              /node_modules\/nodemailer\//,
              /node_modules\/@sentry\/bun\//,
              /node_modules\/wrangler\//,
            ];
      const violations = modules.filter((id) =>
        forbidden.some((pattern) => pattern.test(id)),
      );
      if (violations.length)
        this.error(`Unexpected ${name} dependencies: ${violations.join(', ')}`);
      await mkdir('.wrangler/bundle-audit', { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- name is the checked client/ssr environment enum.
      await writeFile(
        `.wrangler/bundle-audit/${name}.json`,
        JSON.stringify(
          { environment: name, modules, removedBrowserWorkers },
          null,
          2,
        ),
      );
    },
  };
}
