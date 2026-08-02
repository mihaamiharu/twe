import { describe, expect, it } from 'bun:test';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
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

  it('loads all seven checkpoint outlines with the reusable authoring structure', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );

    expect(content).not.toBeNull();
    if (!content) throw new Error('Expected Indonesian course content');

    expect(content.courseSlug).toBe(AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG);
    expect(content.locale).toBe('id');
    expect(content.templateVersion).toBe(1);
    expect(content.checkpoints).toHaveLength(7);

    for (const checkpoint of content.checkpoints) {
      expect(checkpoint.title.length).toBeGreaterThan(0);
      expect(checkpoint.objective.length).toBeGreaterThan(0);
      expect(checkpoint.video.status).toBe('planned');
      expect(checkpoint.writtenLesson).toContain('##');
      expect(checkpoint.aiActivity.learnerActions).toHaveLength(4);
      expect(checkpoint.localExercise.instructions.length).toBeGreaterThan(0);
      expect(checkpoint.evidenceChecklist.length).toBeGreaterThan(0);
      expect(checkpoint.reflectionPrompts.length).toBeGreaterThan(0);
      expect(checkpoint.completionAction.id).toBe(checkpoint.completionId);
      expect(checkpoint.completionAction.selfAttested).toBe(true);
    }

    expect(content.checkpoints[6]?.capstoneReference).toBe(content.capstone.id);
    expect(content.capstone.requirements).toHaveLength(7);
    expect(content.capstone.reflectionId).toBe(
      'ai-assisted-qa-workflow.capstone.reflection',
    );
    expect(content.capstone.completionAction.selfAttested).toBe(true);
  });

  it('does not fall back to Indonesian course content for English', async () => {
    const englishContent = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'en',
    );

    expect(englishContent).toBeNull();
  });
});
