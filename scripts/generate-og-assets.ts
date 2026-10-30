/* eslint-disable security/detect-non-literal-fs-filename -- all paths derive from fixed repository inputs or generated SHA-256 names. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { z } from 'zod';
import { readContentSources } from './generate-content-manifest';
import {
  ACTIVE_CHALLENGE_TIERS,
  CONTENT_LOCALES,
} from '../src/lib/content-sources';
import {
  getOgKey,
  normalizeOgParams,
  type OgImageInput,
  type OgImageParams,
} from '../src/lib/og-params';
import { parseFrontmatter } from '../src/lib/markdown-document';
import {
  parseChallengeTierJson,
  parseTutorialRegistryJson,
} from '../src/server/content-validation';
import type { OgResources } from '../src/server/og-types';

const root = resolve(import.meta.dirname, '..');
const statePath = join(root, '.tanstack', 'og-images.json');
const pathsOutput = join(root, 'src', 'lib', 'generated', 'og-catalog.json');
const resourcesOutput = join(
  root,
  'src',
  'server',
  'generated',
  'og-resources.json',
);
const resolvePackage = createRequire(join(root, 'package.json')).resolve;
const regularFontPath = resolvePackage(
  '@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff',
);
const boldFontPath = resolvePackage(
  '@fontsource/instrument-sans/files/instrument-sans-latin-700-normal.woff',
);
const inspectorImagePath = join(
  root,
  'public/illustrations/twe-inspector-male-hero.png',
);

export const ogSourceFiles = [
  join(root, 'src/components/og-image-template.tsx'),
  join(root, 'src/components/home-og-image-template.tsx'),
  join(root, 'src/server/og-template.server.ts'),
  join(root, 'src/server/og-layout.bun.server.ts'),
  join(root, 'src/server/og-png.bun.server.ts'),
  join(root, 'src/lib/og-params.ts'),
  join(root, 'src/lib/markdown-document.ts'),
  inspectorImagePath,
  join(root, 'bun.lock'),
  regularFontPath,
  boldFontPath,
];

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function writeAtomic(path: string, data: string | Uint8Array) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, data);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function writeJson(path: string, value: object) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  try {
    if ((await readFile(path, 'utf8')) === text) return;
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  await writeAtomic(path, text);
}

interface Card {
  params: OgImageParams;
  path: string;
  fingerprint: string;
}

async function readOgInputs() {
  const { manifest, sourceFiles } = await readContentSources();
  const assetBytes = await Promise.all(
    ogSourceFiles.map((path) => readFile(path)),
  );
  const files = new Map(
    ogSourceFiles.map((path, index) => [path, assetBytes.at(index)]),
  );
  const regular = files.get(regularFontPath);
  const bold = files.get(boldFontPath);
  const inspector = files.get(inspectorImagePath);
  if (!regular || !bold || !inspector)
    throw new Error('OG resource inputs are missing.');
  const resources: OgResources = {
    regularFont: regular.toString('base64'),
    boldFont: bold.toString('base64'),
    inspectorImage: `data:image/png;base64,${inspector.toString('base64')}`,
  };
  const rendererDigest = createHash('sha256');
  for (const bytes of assetBytes) rendererDigest.update(bytes);
  const version = rendererDigest.digest('hex');
  const cards = new Map<string, Card>();
  const add = (id: string, input: OgImageInput) => {
    const key = getOgKey(input);
    if (cards.has(key)) return;
    // Stable identity URLs survive font/template/title edits; cache them briefly.
    const filename = createHash('sha256').update(id).digest('hex');
    cards.set(key, {
      params: normalizeOgParams(input),
      path: `/og/${filename}.png`,
      fingerprint: createHash('sha256')
        .update(version)
        .update(key)
        .digest('hex'),
    });
  };
  add('home', { type: 'Home' });
  add('default', {});
  const registry = parseTutorialRegistryJson(
    manifest.registry,
    'tutorials/registry.json',
  );
  const challenges = ACTIVE_CHALLENGE_TIERS.flatMap((tier) => {
    const content = new Map(Object.entries(manifest.tiers)).get(tier);
    return content === undefined
      ? []
      : parseChallengeTierJson(content, `content/challenges/${tier}.json`)
          .challenges;
  });
  for (const locale of CONTENT_LOCALES) {
    for (const tutorial of registry.tutorials) {
      if (tutorial.status && tutorial.status !== 'published') continue;
      const document =
        manifest.tutorials[`${locale}/${tutorial.slug}.md`] ??
        manifest.tutorials[`en/${tutorial.slug}.md`];
      const title =
        document === undefined
          ? tutorial.slug
          : parseFrontmatter(document).meta.title || tutorial.slug;
      add(`learn/${locale}/${tutorial.slug}`, { title, type: 'Lesson' });
    }
    for (const challenge of challenges) {
      if (challenge.status && challenge.status !== 'published') continue;
      add(`practice/${locale}/${challenge.slug}`, {
        title:
          locale === 'id'
            ? (challenge.title.id ?? challenge.title.en)
            : challenge.title.en,
        type: 'Challenge',
        difficulty: challenge.difficulty,
        xp: challenge.xpReward,
      });
    }
  }
  return { cards, resources, sourceFiles: [...sourceFiles, ...ogSourceFiles] };
}

async function writeManifests(
  inputs: Awaited<ReturnType<typeof readOgInputs>>,
) {
  // Home always has a static card; its illustration need not enter the Worker.
  await writeJson(resourcesOutput, {
    regularFont: inputs.resources.regularFont,
    boldFont: inputs.resources.boldFont,
  });
  await writeJson(pathsOutput, {
    paths: Object.fromEntries(
      [...inputs.cards].map(([key, card]) => [key, card.path]),
    ),
  });
}

/** Source generation only: does not import or execute either rendering engine. */
export async function generateOgManifests() {
  const inputs = await readOgInputs();
  await writeManifests(inputs);
  return { cards: inputs.cards.size, sourceFiles: inputs.sourceFiles };
}

async function buildOgAssets() {
  const inputs = await readOgInputs();
  const stateSchema = z.record(z.string(), z.string());
  let previous: z.infer<typeof stateSchema> = {};
  try {
    const parsed: unknown = JSON.parse(await readFile(statePath, 'utf8'));
    previous = stateSchema.parse(parsed);
  } catch (error) {
    if (
      !isMissing(error) &&
      !(error instanceof SyntaxError) &&
      !(error instanceof z.ZodError)
    )
      throw error;
  }
  const [
    { renderOgSvg },
    { renderOgPng },
    { getOgElement, getOgRenderOptions },
  ] = await Promise.all([
    import('../src/server/og-layout.bun.server'),
    import('../src/server/og-png.bun.server'),
    import('../src/server/og-template.server'),
  ]);
  const fingerprints: Record<string, string> = {};
  for (const card of inputs.cards.values()) {
    const output = join(root, 'public', card.path.slice(1));
    let exists = false;
    try {
      exists = (await stat(output)).isFile();
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    if (!exists || previous[card.path] !== card.fingerprint) {
      const svg = await renderOgSvg(
        getOgElement(card.params, inputs.resources),
        getOgRenderOptions(inputs.resources),
      );
      const png = await renderOgPng(svg);
      await writeAtomic(output, new Uint8Array(png));
    }
    fingerprints[card.path] = card.fingerprint;
  }
  // Publish metadata only after every referenced image is ready.
  await writeManifests(inputs);
  await writeJson(statePath, fingerprints);
  return { cards: inputs.cards.size, sourceFiles: inputs.sourceFiles };
}

let generation: ReturnType<typeof buildOgAssets> | undefined;
export function generateOgAssets() {
  generation ??= buildOgAssets().finally(() => {
    generation = undefined;
  });
  return generation;
}

if (import.meta.main) {
  const manifestsOnly = process.argv.includes('--manifest-only');
  const result = await (manifestsOnly
    ? generateOgManifests()
    : generateOgAssets());
  console.log(
    `Generated ${result.cards} OG ${manifestsOnly ? 'source entries; PNG rendering deferred' : 'assets'}.`,
  );
}
