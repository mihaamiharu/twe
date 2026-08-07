import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { getCourseContent } from '@/server/course-content.server';

const starterRoot = join(
  process.cwd(),
  'starter-repository',
  'ai-assisted-qa-workflow-starter',
);

const requiredStarterArtifacts = [
  'docs/requirements/requirements-notes.md',
  'docs/requirements/risk-list.md',
  'docs/test-cases/test-strategy.md',
  'docs/test-cases/prioritized-scenarios.md',
  'docs/test-cases/ai-critique.md',
  'docs/test-cases/test-cases.md',
  'docs/test-cases/automation-map.md',
  'docs/test-cases/automation-decision-log.md',
  'docs/reports/execution-report.md',
  'docs/reports/failure-packet.md',
  'docs/reports/failure-analysis.md',
  'docs/reports/triage-notes.md',
  'docs/reports/defect-report.md',
  'docs/reports/quality-summary.md',
] as const;

describe('AI-assisted QA course starter consistency', () => {
  it('keeps the course paths and starter templates aligned', async () => {
    const content = await getCourseContent('ai-assisted-qa-workflow', 'id');
    const triage = content?.checkpoints.find(
      (checkpoint) => checkpoint.slug === '06-triage',
    );

    expect(triage?.localExercise.repositoryPaths).toContain(
      'docs/reports/failure-packet.md',
    );

    for (const artifact of requiredStarterArtifacts) {
      expect(existsSync(join(starterRoot, artifact))).toBe(true);
    }
  });
});
