import { describe, expect, it } from 'bun:test';
import {
  AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
  getCourseContent,
  getCourseManifest,
} from '@/server/course-content.server';
import {
  COURSE_CHECKPOINT_XP,
  COURSE_COMPLETION_ACHIEVEMENT_ID,
  applyCourseUnitCompletion,
  courseCapstoneCompletionInputSchema,
  courseCheckpointCompletionInputSchema,
  getCourseProgressTutorialSlug,
  isCourseComplete,
  isCourseCompletionEligible,
  type CourseProgressState,
} from '@/lib/course-progress';
import { getAchievementById } from '@/lib/achievements';

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
      startHere: '/$locale/courses/$courseSlug/start-here',
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
    expect(content.overview.title).toBe('AI-Assisted QA Workflow');
    expect(content.overview.targetAudience.length).toBeGreaterThan(0);
    expect(content.overview.outcome.length).toBeGreaterThan(0);
    expect(content.overview.prerequisites.length).toBeGreaterThan(0);
    expect(content.overview.startHere.steps.length).toBeGreaterThan(0);
    expect(content.overview.setupRequirements.length).toBeGreaterThan(0);
    expect(content.startHere.steps).toHaveLength(7);
    expect(content.startHere.expectedOutput.lines).toContain('1 passed');
    expect(content.startHere.platformNotes.map((note) => note.id)).toEqual([
      'windows',
      'macos',
      'linux',
    ]);
    expect(content.startHere.troubleshooting.length).toBeGreaterThan(0);
    expect(content.startHere.safetyRules.length).toBeGreaterThan(0);
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

  it('defines checkpoint 7 as the quality decision handoff into the capstone', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === '07-quality-summary',
    );

    expect(checkpoint).toBeTruthy();
    expect(checkpoint?.order).toBe(7);
    expect(checkpoint?.objective).toMatch(
      /tested|belum diuji|evidence|residual risk|rekomendasi/i,
    );
    expect(checkpoint?.writtenLesson).toMatch(
      /tested|untested|limitations|residual risk|release/i,
    );
    expect(checkpoint?.aiActivity.prompt).toMatch(
      /quality summary|limitations|residual risk|release|verdict/i,
    );
    expect(checkpoint?.aiActivity.prompt).not.toMatch(
      /ChatGPT|Claude|Copilot/i,
    );
    expect(checkpoint?.localExercise.repositoryPaths).toEqual([
      '07-quality-summary',
      'docs/reports/',
    ]);
    expect(checkpoint?.localExercise.expectedArtifacts).toContain(
      'quality-summary.md',
    );
    expect(checkpoint?.localExercise.expectedArtifacts).toContain(
      'capstone evidence package',
    );
    expect(checkpoint?.evidenceChecklist.join(' ')).toMatch(
      /tested|untested|limitations|residual risk|rekomendasi/i,
    );
    expect(checkpoint?.reflectionPrompts.length).toBeGreaterThanOrEqual(3);
    expect(checkpoint?.capstoneReference).toBe(content?.capstone.id);
    expect(checkpoint?.completionAction).toMatchObject({
      id: 'ai-assisted-qa-workflow.checkpoints.07-quality-summary.completion',
      selfAttested: true,
    });
  });

  it('does not fall back to Indonesian course content for English', async () => {
    const englishContent = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'en',
    );

    expect(englishContent).toBeNull();
  });
});

describe('AI-assisted QA course progress contract', () => {
  const checkpointSlugs = expectedCheckpointSlugs;
  const initialState: CourseProgressState = {
    completedCheckpointSlugs: [],
    capstoneCompleted: false,
  };

  it('awards existing checkpoint XP once and makes duplicate completion idempotent', () => {
    const first = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: checkpointSlugs[0] },
      checkpointSlugs,
    );
    const duplicate = applyCourseUnitCompletion(
      first.state,
      { kind: 'checkpoint', id: checkpointSlugs[0] },
      checkpointSlugs,
    );

    expect(first.xpAwarded).toBe(COURSE_CHECKPOINT_XP);
    expect(first.wasAlreadyCompleted).toBe(false);
    expect(duplicate.xpAwarded).toBe(0);
    expect(duplicate.wasAlreadyCompleted).toBe(true);
    expect(duplicate.state).toEqual(first.state);
  });

  it('requires every checkpoint and the capstone before course completion', () => {
    let state = initialState;
    let checkpointXp = 0;

    for (const checkpointSlug of checkpointSlugs) {
      const outcome = applyCourseUnitCompletion(
        state,
        { kind: 'checkpoint', id: checkpointSlug },
        checkpointSlugs,
      );
      checkpointXp += outcome.xpAwarded;
      state = outcome.state;
    }

    expect(checkpointXp).toBe(7 * COURSE_CHECKPOINT_XP);
    expect(isCourseComplete(state, checkpointSlugs)).toBe(false);

    const capstone = applyCourseUnitCompletion(
      state,
      { kind: 'capstone', id: 'ai-assisted-qa-workflow.capstone' },
      checkpointSlugs,
    );

    expect(capstone.xpAwarded).toBe(0);
    expect(capstone.courseComplete).toBe(true);
    expect(isCourseComplete(capstone.state, checkpointSlugs)).toBe(true);
    expect(
      isCourseCompletionEligible(capstone.state, checkpointSlugs, false),
    ).toBe(true);
    expect(
      isCourseCompletionEligible(capstone.state, checkpointSlugs, true),
    ).toBe(false);

    const duplicateCapstone = applyCourseUnitCompletion(
      capstone.state,
      { kind: 'capstone', id: 'ai-assisted-qa-workflow.capstone' },
      checkpointSlugs,
    );
    expect(duplicateCapstone.wasAlreadyCompleted).toBe(true);
    expect(duplicateCapstone.xpAwarded).toBe(0);
  });

  it('does not make an incomplete course eligible for its achievement', () => {
    const onlyFirstCheckpoint = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: checkpointSlugs[0] },
      checkpointSlugs,
    ).state;

    expect(
      isCourseCompletionEligible(onlyFirstCheckpoint, checkpointSlugs, false),
    ).toBe(false);
    expect(
      isCourseCompletionEligible(initialState, checkpointSlugs, true),
    ).toBe(false);
  });

  it('requires the capstone in addition to all seven completed checkpoints for the achievement', () => {
    const allCheckpointsState: CourseProgressState = {
      completedCheckpointSlugs: checkpointSlugs,
      capstoneCompleted: false,
    };
    const completedState = {
      ...allCheckpointsState,
      capstoneCompleted: true,
    };

    expect(isCourseComplete(allCheckpointsState, checkpointSlugs)).toBe(false);
    expect(
      isCourseCompletionEligible(allCheckpointsState, checkpointSlugs, false),
    ).toBe(false);
    expect(isCourseComplete(completedState, checkpointSlugs)).toBe(true);
    expect(
      isCourseCompletionEligible(completedState, checkpointSlugs, false),
    ).toBe(true);
  });

  it('uses the existing capstone completion contract without awarding XP', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    if (!content) throw new Error('Expected Indonesian course content');

    const parsed = courseCapstoneCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      capstoneId: content.capstone.id,
      completionId: content.capstone.completionAction.id,
      reflectionId: content.capstone.reflectionId,
      exerciseConfirmed: true,
      reflectionConfirmed: true,
    });

    let state: CourseProgressState = {
      completedCheckpointSlugs: checkpointSlugs,
      capstoneCompleted: false,
    };
    const outcome = applyCourseUnitCompletion(
      state,
      { kind: 'capstone', id: parsed.capstoneId },
      checkpointSlugs,
    );
    state = outcome.state;

    expect(parsed.capstoneId).toBe('ai-assisted-qa-workflow.capstone');
    expect(outcome.xpAwarded).toBe(0);
    expect(outcome.courseComplete).toBe(true);
    expect(state.capstoneCompleted).toBe(true);
  });

  it('defines one zero-XP course completion achievement', () => {
    const achievement = getAchievementById(COURSE_COMPLETION_ACHIEVEMENT_ID);

    expect(achievement).toMatchObject({
      id: COURSE_COMPLETION_ACHIEVEMENT_ID,
      category: 'SPECIAL',
      xpReward: 0,
    });
  });

  it('accepts only Indonesian self-attestation and ignores review metadata', () => {
    const parsed = courseCheckpointCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      checkpointSlug: checkpointSlugs[0],
      completionId: 'completion-id',
      reflectionId: 'reflection-id',
      exerciseConfirmed: true,
      reflectionConfirmed: true,
      aiReview: 'needs-revision',
      humanReview: 'approved',
    });

    expect(parsed.locale).toBe('id');
    expect(parsed).not.toHaveProperty('aiReview');
    expect(parsed).not.toHaveProperty('humanReview');
    expect(() =>
      courseCheckpointCompletionInputSchema.parse({
        ...parsed,
        locale: 'en',
      }),
    ).toThrow();
    expect(() =>
      courseCheckpointCompletionInputSchema.parse({
        ...parsed,
        exerciseConfirmed: false,
      }),
    ).toThrow();
    expect(() =>
      courseCheckpointCompletionInputSchema.parse({
        ...parsed,
        reflectionConfirmed: false,
      }),
    ).toThrow();
  });

  it('uses a stable hidden tutorial key for existing progress storage', () => {
    expect(
      getCourseProgressTutorialSlug(
        AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
        checkpointSlugs[0],
      ),
    ).toBe('course:ai-assisted-qa-workflow:01-requirements');
  });

  it('records checkpoint 3 through the existing self-attested completion contract', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === '03-test-writing',
    );

    expect(checkpoint).toBeTruthy();
    if (!checkpoint) throw new Error('Expected test-writing checkpoint');

    const parsed = courseCheckpointCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      checkpointSlug: checkpoint.slug,
      completionId: checkpoint.completionAction.id,
      reflectionId: checkpoint.reflectionId,
      exerciseConfirmed: true,
      reflectionConfirmed: true,
    });
    const first = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );
    const duplicate = applyCourseUnitCompletion(
      first.state,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );

    expect(parsed.checkpointSlug).toBe('03-test-writing');
    expect(first.xpAwarded).toBe(COURSE_CHECKPOINT_XP);
    expect(duplicate.wasAlreadyCompleted).toBe(true);
    expect(duplicate.xpAwarded).toBe(0);
  });

  it('records checkpoint 4 through the existing self-attested completion contract', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === '04-automation',
    );

    expect(checkpoint).toBeTruthy();
    if (!checkpoint) throw new Error('Expected automation checkpoint');

    const parsed = courseCheckpointCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      checkpointSlug: checkpoint.slug,
      completionId: checkpoint.completionAction.id,
      reflectionId: checkpoint.reflectionId,
      exerciseConfirmed: true,
      reflectionConfirmed: true,
    });
    const first = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );
    const duplicate = applyCourseUnitCompletion(
      first.state,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );

    expect(parsed.checkpointSlug).toBe('04-automation');
    expect(first.xpAwarded).toBe(COURSE_CHECKPOINT_XP);
    expect(duplicate.wasAlreadyCompleted).toBe(true);
    expect(duplicate.xpAwarded).toBe(0);
  });

  it('records checkpoint 5 through the existing self-attested completion contract', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === '05-execution',
    );

    expect(checkpoint).toBeTruthy();
    if (!checkpoint) throw new Error('Expected execution checkpoint');

    const parsed = courseCheckpointCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      checkpointSlug: checkpoint.slug,
      completionId: checkpoint.completionAction.id,
      reflectionId: checkpoint.reflectionId,
      exerciseConfirmed: true,
      reflectionConfirmed: true,
    });
    const first = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );
    const duplicate = applyCourseUnitCompletion(
      first.state,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );

    expect(parsed.checkpointSlug).toBe('05-execution');
    expect(first.xpAwarded).toBe(COURSE_CHECKPOINT_XP);
    expect(duplicate.wasAlreadyCompleted).toBe(true);
    expect(duplicate.xpAwarded).toBe(0);
  });

  it('records checkpoint 6 through the existing self-attested completion contract', async () => {
    const content = await getCourseContent(
      AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      'id',
    );
    const checkpoint = content?.checkpoints.find(
      (candidate) => candidate.slug === '06-triage',
    );

    expect(checkpoint).toBeTruthy();
    if (!checkpoint) throw new Error('Expected failure triage checkpoint');

    const parsed = courseCheckpointCompletionInputSchema.parse({
      courseSlug: AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
      locale: 'id',
      checkpointSlug: checkpoint.slug,
      completionId: checkpoint.completionAction.id,
      reflectionId: checkpoint.reflectionId,
      exerciseConfirmed: true,
      reflectionConfirmed: true,
    });
    const first = applyCourseUnitCompletion(
      initialState,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );
    const duplicate = applyCourseUnitCompletion(
      first.state,
      { kind: 'checkpoint', id: parsed.checkpointSlug },
      checkpointSlugs,
    );

    expect(parsed.checkpointSlug).toBe('06-triage');
    expect(first.xpAwarded).toBe(COURSE_CHECKPOINT_XP);
    expect(duplicate.wasAlreadyCompleted).toBe(true);
    expect(duplicate.xpAwarded).toBe(0);
  });
});
