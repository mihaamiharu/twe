/**
 * Markdown files shipped with the AI-assisted QA companion repository.
 *
 * Keep this list explicit so course resource links cannot read arbitrary files
 * from the server filesystem.
 */
export const COURSE_STARTER_RESOURCE_PATHS = [
  'README.md',
  'docs/README.md',
  'docs/requirements/acceptance-criteria.md',
  'docs/requirements/product-requirements.md',
  'docs/requirements/requirements-notes.md',
  'docs/requirements/risk-list.md',
  'docs/test-cases/ai-critique.md',
  'docs/test-cases/automation-decision-log.md',
  'docs/test-cases/automation-map.md',
  'docs/test-cases/prioritized-scenarios.md',
  'docs/test-cases/test-cases.md',
  'docs/test-cases/test-strategy.md',
  'docs/reports/defect-report.md',
  'docs/reports/execution-report.md',
  'docs/reports/failure-analysis.md',
  'docs/reports/failure-packet.md',
  'docs/reports/quality-summary.md',
  'docs/reports/triage-notes.md',
  'evidence/README.md',
  'test-data/synthetic-data.md',
] as const;

const resourcePathSet = new Set<string>(COURSE_STARTER_RESOURCE_PATHS);

const resourceDirectoriesByCheckpoint = new Map<string, readonly string[]>([
  ['01-requirements', ['docs/requirements']],
  ['02-test-design', ['docs/test-cases']],
  ['03-test-writing', ['docs/test-cases']],
  ['04-automation', ['docs/test-cases']],
  ['05-execution', ['docs/reports', 'evidence']],
  ['06-triage', ['docs/reports']],
  ['07-quality-summary', ['docs/reports']],
  [
    'capstone',
    ['docs/requirements', 'docs/test-cases', 'docs/reports', 'evidence'],
  ],
]);

export function isCourseStarterResourcePath(path: string): boolean {
  return resourcePathSet.has(path);
}

/**
 * Resolve an authored reference such as `requirements-notes.md` to the
 * concrete path in the companion repository for the current checkpoint.
 */
export function resolveCourseStarterResourcePath(
  checkpointSlug: string,
  reference: string,
): string | null {
  const normalizedReference = reference.trim().replace(/^`|`$/g, '');

  if (isCourseStarterResourcePath(normalizedReference)) {
    return normalizedReference;
  }

  const filenameMatch = normalizedReference.match(
    /([A-Za-z0-9][A-Za-z0-9_./-]*\.md)\b/i,
  );
  if (!filenameMatch) return null;

  const referencedPath = filenameMatch[1];
  if (isCourseStarterResourcePath(referencedPath)) return referencedPath;

  const filename = referencedPath.split('/').pop();
  if (!filename) return null;
  const directories = [
    ...(resourceDirectoriesByCheckpoint.get(checkpointSlug) ?? []),
    'docs/requirements',
    'docs/test-cases',
    'docs/reports',
    'evidence',
  ];

  for (const directory of directories) {
    const candidate = `${directory}/${filename}`;
    if (isCourseStarterResourcePath(candidate)) return candidate;
  }

  return null;
}
