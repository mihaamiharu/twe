/* eslint-disable security/detect-non-literal-fs-filename -- inputs are fixed repository directories; no request data is used. */
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  ACTIVE_CHALLENGE_TIERS,
  CONTENT_LOCALES,
  type ContentSourceManifest,
} from '../src/lib/content-sources';

const repositoryRoot = resolve(import.meta.dirname, '..');
export const contentSourceDirectories = [
  join(repositoryRoot, 'tutorials'),
  join(repositoryRoot, 'content', 'challenges'),
];

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** Read fresh editorial inputs for both content and OG asset generation. */
export async function readContentSources() {
  const registryPath = join(repositoryRoot, 'tutorials', 'registry.json');
  const sourceFiles = [registryPath];
  const manifest: ContentSourceManifest = {
    registry: await readFile(registryPath, 'utf8'),
    tiers: {},
    tutorials: {},
  };

  for (const tier of ACTIVE_CHALLENGE_TIERS) {
    const file = join(repositoryRoot, 'content', 'challenges', `${tier}.json`);
    sourceFiles.push(file);
    try {
      manifest.tiers[tier] = await readFile(file, 'utf8');
    } catch (error) {
      // Match the catalog's existing behavior for an absent optional tier.
      if (!isMissingFile(error)) throw error;
    }
  }

  for (const locale of CONTENT_LOCALES) {
    const directory = join(repositoryRoot, 'tutorials', locale);
    const files = await readdir(directory, { withFileTypes: true });
    const markdownFiles = files
      .filter((file) => file.isFile() && file.name.endsWith('.md'))
      .map((file) => file.name)
      .sort();
    for (const name of markdownFiles) {
      const file = join(directory, name);
      sourceFiles.push(file);
      manifest.tutorials[`${locale}/${name}`] = await readFile(file, 'utf8');
    }
  }

  return { manifest, sourceFiles };
}

async function writeContentManifest() {
  const { manifest, sourceFiles } = await readContentSources();
  const output = join(
    repositoryRoot,
    'src',
    'server',
    'generated',
    'content-manifest.json',
  );
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  let existing: string | undefined;
  try {
    existing = await readFile(output, 'utf8');
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
  const changed = serialized !== existing;
  if (changed) {
    await mkdir(dirname(output), { recursive: true });
    const temporary = `${output}.${process.pid}.tmp`;
    try {
      await writeFile(temporary, serialized);
      await rename(temporary, output);
    } finally {
      await rm(temporary, { force: true });
    }
  }

  return {
    changed,
    sourceFiles,
    tutorialDocuments: Object.keys(manifest.tutorials).length,
  };
}

let generation: ReturnType<typeof writeContentManifest> | undefined;

/** Coalesce concurrent Vite environment hooks into one atomic write. */
export function generateContentManifest() {
  generation ??= writeContentManifest().finally(() => {
    generation = undefined;
  });
  return generation;
}

if (import.meta.main) {
  const result = await generateContentManifest();
  console.log(
    `${result.changed ? 'Generated' : 'Kept'} server content snapshot (${result.tutorialDocuments} tutorial documents).`,
  );
}
