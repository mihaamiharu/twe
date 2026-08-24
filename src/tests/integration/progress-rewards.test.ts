import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { and, eq } from 'drizzle-orm';
import {
  achievements,
  challenges,
  db,
  progress,
  submissions,
  testCases,
  tutorials,
  userAchievements,
  users,
} from '../../db';
import {
  challengeSubmissionHandler,
  CreateSubmissionSchema,
} from '../../server/submissions.fn';
import { completeTutorialHandler } from '../../server/tutorials.fn';
import { getEarnedAchievementIds, getUserStats } from '../../lib/stats';
import { setupTestDb, truncateTables } from './setup';
import type { z } from 'zod';

const testUserId = '00000000-0000-0000-0000-000000000001';
const otherUserId = '00000000-0000-0000-0000-000000000002';
const challengeId = '00000000-0000-0000-0000-000000000101';
const testCaseId = '00000000-0000-0000-0000-000000000201';
const tutorialId = '00000000-0000-0000-0000-000000000301';
const achievementId = '00000000-0000-0000-0000-000000000401';

type SubmissionInput = z.infer<typeof CreateSubmissionSchema>;

function requireData<T>(result: {
  success: boolean;
  data?: T;
  error?: string;
}): T {
  if (!result.success || result.data === undefined) {
    throw new Error(result.error ?? 'Expected a successful response');
  }
  return result.data;
}

void mock.module('../../server/content.server', () => ({
  getRawChallengeContent: (slug: string) =>
    slug === 'test-challenge'
      ? {
          slug,
          title: 'Test Challenge',
          type: 'JAVASCRIPT',
          difficulty: 'EASY',
          xpReward: 100,
          order: 1,
          category: 'javascript',
          description: 'Description',
          instructions: 'Instructions',
          starterCode: '',
          htmlContent: '',
          testCases: [],
          solution: '',
        }
      : null,
}));

void mock.module('@/lib/logger', () => ({
  logger: {
    info: () => {},
    error: () => {},
    warn: () => {},
  },
}));

function passingSubmission(
  overrides: Partial<SubmissionInput> = {},
): SubmissionInput {
  return {
    challengeSlug: 'test-challenge',
    code: 'return true;',
    isPractice: false,
    testResults: [{ testCaseId, passed: true, output: true }],
    locale: 'en',
    ...overrides,
  };
}

async function seedChallenge(): Promise<void> {
  await db.insert(challenges).values({
    id: challengeId,
    title: { en: 'Test Challenge', id: 'Tantangan Uji' },
    slug: 'test-challenge',
    type: 'JAVASCRIPT',
    xpReward: 100,
    difficulty: 'EASY',
    order: 1,
    isPublished: true,
    completionCount: 0,
  });

  await db.insert(testCases).values({
    id: testCaseId,
    challengeId,
    description: 'Passes',
    expectedOutput: true,
    input: null,
    order: 1,
    isHidden: false,
  });
}

async function seedAchievement(slug: 'first-challenge' | 'first-tutorial') {
  await db.insert(achievements).values({
    id: achievementId,
    slug,
    name: { en: slug, id: slug },
    description: { en: slug, id: slug },
    icon: '⭐',
    category: slug === 'first-tutorial' ? 'tutorials' : 'challenges',
    requirementType:
      slug === 'first-tutorial' ? 'tutorial_count' : 'challenge_count',
    requirementValue: 1,
    xpReward: 50,
  });
}

describe('Learn and Practice progress/reward invariants', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateTables();
    await db.insert(users).values([
      {
        id: testUserId,
        name: 'Test User',
        email: 'progress-test@example.com',
        xp: 0,
        level: 1,
      },
      {
        id: otherUserId,
        name: 'Other User',
        email: 'progress-test-2@example.com',
        xp: 0,
        level: 1,
      },
    ]);
    await seedChallenge();
  });

  test('unauthenticated write calls are rejected before any progress or reward work', async () => {
    const submission = await challengeSubmissionHandler({
      data: passingSubmission(),
      context: undefined,
    });
    const tutorial = await completeTutorialHandler({
      data: { slug: 'dom-tree-hierarchy', locale: 'en' },
      context: undefined,
    });

    expect(submission).toEqual({
      success: false,
      error: 'You must be signed in to perform this action',
    });
    expect(tutorial).toEqual({ success: false, error: 'Unauthorized' });
    expect(await db.query.progress.findMany()).toHaveLength(0);
    expect(await db.query.submissions.findMany()).toHaveLength(0);
  });

  test('first success awards authoritative XP once and keeps bilingual slug identity', async () => {
    const result = await challengeSubmissionHandler({
      data: passingSubmission({ locale: 'id' }),
      context: { user: { id: testUserId } },
    });

    expect(result.success).toBe(true);
    const resultData = requireData(result);
    expect(resultData.submission.xpEarned).toBe(100);
    expect(resultData.isFirstCompletion).toBe(true);

    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.slug, 'test-challenge'),
    });
    expect(user?.xp).toBe(100);
    expect(challenge?.id).toBe(challengeId);
    expect(challenge?.completionCount).toBe(1);
  });

  test('repeated successful attempts retain attempts but do not repeat completion credit', async () => {
    await challengeSubmissionHandler({
      data: passingSubmission(),
      context: { user: { id: testUserId } },
    });
    const repeated = await challengeSubmissionHandler({
      data: passingSubmission({ code: 'return true; // retry' }),
      context: { user: { id: testUserId } },
    });

    expect(repeated.success).toBe(true);
    const repeatedData = requireData(repeated);
    expect(repeatedData.isFirstCompletion).toBe(false);
    expect(repeatedData.submission.xpEarned).toBe(0);

    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const userProgress = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, testUserId),
        eq(progress.challengeId, challengeId),
      ),
    });
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.userId, testUserId),
    });
    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });
    expect(user?.xp).toBe(100);
    expect(userProgress).toHaveLength(1);
    expect(userProgress[0]?.attempts).toBe(2);
    expect(userSubmissions).toHaveLength(2);
    expect(challenge?.completionCount).toBe(1);
  });

  test('failed attempts persist without completion credit and can be followed by one success', async () => {
    const failed = await challengeSubmissionHandler({
      data: passingSubmission({
        code: 'return false;',
        testResults: [{ testCaseId, passed: false, error: 'failed' }],
      }),
      context: { user: { id: testUserId } },
    });
    const passed = await challengeSubmissionHandler({
      data: passingSubmission(),
      context: { user: { id: testUserId } },
    });

    expect(failed.success).toBe(true);
    expect(passed.success).toBe(true);
    const passedData = requireData(passed);
    expect(passedData.isFirstCompletion).toBe(true);

    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const userProgress = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, testUserId),
        eq(progress.challengeId, challengeId),
      ),
    });
    expect(user?.xp).toBe(100);
    expect(userProgress?.attempts).toBe(2);
    expect(userProgress?.isCompleted).toBe(true);
  });

  test('concurrent successful submissions elect one completion winner', async () => {
    await seedAchievement('first-challenge');

    const results = await Promise.all([
      challengeSubmissionHandler({
        data: passingSubmission({ code: 'attempt-a' }),
        context: { user: { id: testUserId } },
      }),
      challengeSubmissionHandler({
        data: passingSubmission({ code: 'attempt-b' }),
        context: { user: { id: testUserId } },
      }),
    ]);

    expect(results.every((result) => result.success)).toBe(true);
    const firstCompletionCount = results.filter(
      (result) => result.success && result.data?.isFirstCompletion,
    ).length;
    const achievementToastCount = results.reduce(
      (count, result) =>
        count +
        (result.success ? (result.data?.newAchievements.length ?? 0) : 0),
      0,
    );
    expect(firstCompletionCount).toBe(1);
    expect(achievementToastCount).toBe(1);

    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const userProgress = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, testUserId),
        eq(progress.challengeId, challengeId),
      ),
    });
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.userId, testUserId),
    });
    expect(user?.xp).toBe(150);
    expect(userProgress).toHaveLength(1);
    expect(userProgress[0]?.attempts).toBe(2);
    expect(userSubmissions).toHaveLength(2);
  });

  test('achievement XP and unlock are idempotent across retries', async () => {
    await seedAchievement('first-challenge');

    const first = await challengeSubmissionHandler({
      data: passingSubmission(),
      context: { user: { id: testUserId } },
    });
    const retry = await challengeSubmissionHandler({
      data: passingSubmission({ code: 'retry' }),
      context: { user: { id: testUserId } },
    });

    expect(first.success).toBe(true);
    expect(retry.success).toBe(true);
    const firstData = requireData(first);
    const retryData = requireData(retry);
    expect(firstData.newAchievements).toHaveLength(1);
    expect(retryData.newAchievements).toHaveLength(0);

    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const unlocked = await db.query.userAchievements.findMany({
      where: and(
        eq(userAchievements.userId, testUserId),
        eq(userAchievements.achievementId, achievementId),
      ),
    });
    expect(unlocked).toHaveLength(1);
    expect(user?.xp).toBe(150);
  });

  test('practice mode is non-persistent and non-rewarding', async () => {
    const result = await challengeSubmissionHandler({
      data: passingSubmission({ isPractice: true }),
      context: { user: { id: testUserId } },
    });

    expect(result.success).toBe(true);
    const resultData = requireData(result);
    expect(resultData.isPracticeMode).toBe(true);
    expect(resultData.submission.xpEarned).toBe(0);
    expect(await db.query.progress.findMany()).toHaveLength(0);
    expect(await db.query.submissions.findMany()).toHaveLength(0);
    expect(
      (await db.query.users.findFirst({ where: eq(users.id, testUserId) }))?.xp,
    ).toBe(0);
  });

  test('transaction rollback removes every write after a deterministic submission failure', async () => {
    await seedAchievement('first-challenge');

    const result = await challengeSubmissionHandler({
      data: passingSubmission({ executionTime: 2147483648 }),
      context: { user: { id: testUserId } },
    });

    expect(result.success).toBe(false);
    expect(await db.query.progress.findMany()).toHaveLength(0);
    expect(await db.query.submissions.findMany()).toHaveLength(0);
    expect(
      (
        await db.query.challenges.findFirst({
          where: eq(challenges.id, challengeId),
        })
      )?.completionCount,
    ).toBe(0);
    expect(
      (await db.query.users.findFirst({ where: eq(users.id, testUserId) }))?.xp,
    ).toBe(0);
    expect(
      await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, testUserId),
      }),
    ).toHaveLength(0);

    const stats = await getUserStats(testUserId);
    expect(stats.totalChallengesCompleted).toBe(0);
    expect(stats.tutorialsCompleted).toBe(0);
    expect(stats.totalXP).toBe(0);
    expect((await getEarnedAchievementIds(testUserId)).size).toBe(0);
  });

  test('tutorial completion and retries are fully idempotent, including view statistics', async () => {
    await db.insert(tutorials).values({
      id: tutorialId,
      slug: 'dom-tree-hierarchy',
      title: { en: 'DOM Tree Hierarchy', id: 'Hierarki DOM' },
      order: 1,
      estimatedMinutes: 5,
      isPublished: true,
    });
    await seedAchievement('first-tutorial');

    const [first, concurrentRetry] = await Promise.all([
      completeTutorialHandler({
        data: { slug: 'dom-tree-hierarchy', locale: 'en' },
        context: { user: { id: testUserId } },
      }),
      completeTutorialHandler({
        data: { slug: 'dom-tree-hierarchy', locale: 'id' },
        context: { user: { id: testUserId } },
      }),
    ]);

    expect(first.success).toBe(true);
    expect(concurrentRetry.success).toBe(true);
    const firstData = requireData(first);
    const concurrentRetryData = requireData(concurrentRetry);
    expect([firstData.xpAwarded, concurrentRetryData.xpAwarded].sort()).toEqual(
      [0, 25],
    );
    expect(
      [
        firstData.newAchievements.length,
        concurrentRetryData.newAchievements.length,
      ].sort(),
    ).toEqual([0, 1]);

    const initialProgress = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, testUserId),
        eq(progress.tutorialId, tutorialId),
      ),
    });
    const initialTutorial = await db.query.tutorials.findFirst({
      where: eq(tutorials.id, tutorialId),
    });
    const initialUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    expect(initialProgress?.isCompleted).toBe(true);
    expect(initialTutorial?.viewCount).toBe(1);
    expect(initialUser?.xp).toBe(75);

    const sequentialRetry = await completeTutorialHandler({
      data: { slug: 'dom-tree-hierarchy', locale: 'en' },
      context: { user: { id: testUserId } },
    });
    expect(sequentialRetry.success).toBe(true);
    const sequentialRetryData = requireData(sequentialRetry);
    expect(sequentialRetryData.xpAwarded).toBe(0);
    expect(sequentialRetryData.newAchievements).toHaveLength(0);

    const [retryA, retryB] = await Promise.all([
      completeTutorialHandler({
        data: { slug: 'dom-tree-hierarchy', locale: 'en' },
        context: { user: { id: testUserId } },
      }),
      completeTutorialHandler({
        data: { slug: 'dom-tree-hierarchy', locale: 'id' },
        context: { user: { id: testUserId } },
      }),
    ]);
    expect(retryA.success).toBe(true);
    expect(retryB.success).toBe(true);
    expect(requireData(retryA).xpAwarded).toBe(0);
    expect(requireData(retryB).xpAwarded).toBe(0);
    expect(requireData(retryA).newAchievements).toHaveLength(0);
    expect(requireData(retryB).newAchievements).toHaveLength(0);

    const finalProgress = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, testUserId),
        eq(progress.tutorialId, tutorialId),
      ),
    });
    const finalTutorial = await db.query.tutorials.findFirst({
      where: eq(tutorials.id, tutorialId),
    });
    const finalUser = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    const unlocked = await db.query.userAchievements.findMany({
      where: and(
        eq(userAchievements.userId, testUserId),
        eq(userAchievements.achievementId, achievementId),
      ),
    });
    expect(finalProgress).toHaveLength(1);
    expect(finalProgress[0]?.isCompleted).toBe(true);
    expect(finalProgress[0]?.completedAt).toEqual(initialProgress?.completedAt);
    expect(finalProgress[0]?.updatedAt).toEqual(initialProgress?.updatedAt);
    expect(finalProgress[0]?.attempts).toBe(initialProgress?.attempts);
    expect(finalTutorial?.viewCount).toBe(1);
    expect(finalUser?.xp).toBe(75);
    expect(unlocked).toHaveLength(1);
  });
});
