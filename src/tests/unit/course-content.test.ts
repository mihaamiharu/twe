import { describe, expect, it } from 'bun:test';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseManifest,
} from '@/server/course-content.server';

const expectedCheckpointSlugs: string[] = [
  '01-requirements',
  '02-test-design',
  '03-test-writing',
  '04-automation',
  '05-execution',
  '06-triage',
  '07-quality-summary',
] as const;

describe('AI-assisted QA course manifest', () => {
  it('defines the ordered Indonesian pilot contract and stable identifiers', async () => {
    const manifest = await getCourseManifest(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );

    expect(manifest).not.toBeNull();
    if (!manifest) throw new Error('Expected the Indonesian course manifest');

    expect(manifest.slug).toBe(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG);
    expect(manifest.defaultLocale).toBe('id');
    expect(manifest.availableLocales).toEqual(['id']);
    expect(manifest.requiresAuthentication).toBe(true);
    expect(manifest.checkpoints).toHaveLength(7);
    expect(manifest.checkpoints.map((checkpoint) => checkpoint.slug)).toEqual(
      expectedCheckpointSlugs,
    );
    expect(manifest.checkpoints.map((checkpoint) => checkpoint.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);

    const reflectionIds = manifest.checkpoints.map(
      (checkpoint) => checkpoint.reflectionId,
    );
    const completionIds = manifest.checkpoints.map(
      (checkpoint) => checkpoint.completionId,
    );

    expect(new Set(reflectionIds).size).toBe(7);
    expect(new Set(completionIds).size).toBe(7);
    expect(reflectionIds[0]).toBe(
      'ai-assisted-qa-workflow.checkpoints.01-requirements.reflection',
    );
    expect(completionIds[6]).toBe(
      'ai-assisted-qa-workflow.checkpoints.07-quality-summary.completion',
    );
    expect(manifest.capstone).toEqual({
      id: 'ai-assisted-qa-workflow.capstone',
      checkpointSlug: '07-quality-summary',
    });
  });

  it('documents the overview and checkpoint route shapes', async () => {
    const manifest = await getCourseManifest(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );

    expect(manifest?.routes).toEqual({
      overview: '/$locale/courses/$courseSlug',
      checkpoint: '/$locale/courses/$courseSlug/checkpoints/$checkpointSlug',
    });
  });

  it('does not fall back to Indonesian content for English or unsupported locales', async () => {
    const englishManifest = await getCourseManifest(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'en',
    );
    const unsupportedLocaleManifest = await getCourseManifest(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'fr',
    );

    expect(englishManifest).toBeNull();
    expect(unsupportedLocaleManifest).toBeNull();
  });
});
