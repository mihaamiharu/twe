import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import {
  PRACTICE_SOLVE_COUNT_THRESHOLD,
  PracticeChallengeGridCard,
  PracticeChallengeRow,
  type PracticeChallengeItemData,
  type PracticeChallengeLabels,
} from '@/components/challenges/practice-challenge-item';

const baseChallenge: PracticeChallengeItemData = {
  slug: 'pw-get-by-role',
  title: 'Locate with getByRole',
  description: 'Target user-facing controls with accessible roles.',
  type: 'PLAYWRIGHT',
  difficulty: 'EASY',
  xpReward: 25,
  completionCount: 0,
  isCompleted: false,
  tags: [],
};

function makeLabels(count: number): PracticeChallengeLabels {
  return {
    type: 'PLAYWRIGHT',
    difficulty: 'Easy',
    category: 'Locators',
    tier: 'Intermediate',
    completionCount: `${count} solved`,
    completed: 'Completed',
    comingSoon: 'Coming Soon',
    start: 'Start',
    review: 'Review',
  };
}

describe('PracticeChallengeRow and PracticeChallengeGridCard solve count visibility', () => {
  afterEach(() => {
    cleanup();
  });

  it('hides cold-start solve counts below threshold in list view while keeping alignment placeholder', () => {
    for (const count of [0, 1, PRACTICE_SOLVE_COUNT_THRESHOLD - 1]) {
      render(
        <PracticeChallengeRow
          challenge={{ ...baseChallenge, completionCount: count }}
          locale="en"
          labels={makeLabels(count)}
        />,
      );

      expect(screen.queryByTestId('challenge-row-solve-count')).toBeNull();
      expect(screen.queryByText(`${count} solved`)).toBeNull();
      const placeholder = screen.getByTestId(
        'challenge-row-solve-count-placeholder',
      );
      expect(placeholder.getAttribute('aria-hidden')).toBe('true');
      expect(screen.getByTestId('challenge-row-xp')).toBeTruthy();
      expect(screen.getByTestId('challenge-row-action')).toBeTruthy();
      cleanup();
    }
  });

  it('shows solve counts at or above threshold in list view', () => {
    for (const count of [PRACTICE_SOLVE_COUNT_THRESHOLD, 42]) {
      render(
        <PracticeChallengeRow
          challenge={{ ...baseChallenge, completionCount: count }}
          locale="en"
          labels={makeLabels(count)}
        />,
      );

      const solveCount = screen.getByTestId('challenge-row-solve-count');
      expect(solveCount.textContent).toBe(`${count} solved`);
      expect(
        screen.queryByTestId('challenge-row-solve-count-placeholder'),
      ).toBeNull();
      cleanup();
    }
  });

  it('hides cold-start solve counts below threshold in grid view and shows counts at or above threshold', () => {
    render(
      <PracticeChallengeGridCard
        challenge={{
          ...baseChallenge,
          completionCount: PRACTICE_SOLVE_COUNT_THRESHOLD - 1,
        }}
        locale="en"
        labels={makeLabels(PRACTICE_SOLVE_COUNT_THRESHOLD - 1)}
      />,
    );
    expect(screen.queryByTestId('challenge-card-solve-count')).toBeNull();
    expect(
      screen.queryByText(`${PRACTICE_SOLVE_COUNT_THRESHOLD - 1} solved`),
    ).toBeNull();
    expect(screen.getByText('25 XP')).toBeTruthy();
    expect(screen.getByText('Start')).toBeTruthy();

    cleanup();

    render(
      <PracticeChallengeGridCard
        challenge={{
          ...baseChallenge,
          completionCount: PRACTICE_SOLVE_COUNT_THRESHOLD,
        }}
        locale="en"
        labels={makeLabels(PRACTICE_SOLVE_COUNT_THRESHOLD)}
      />,
    );
    const solveCount = screen.getByTestId('challenge-card-solve-count');
    expect(solveCount.textContent).toBe(
      `${PRACTICE_SOLVE_COUNT_THRESHOLD} solved`,
    );
  });

  it('hides solve counts on coming-soon items in both views even when count meets threshold', () => {
    const comingSoonChallenge: PracticeChallengeItemData = {
      ...baseChallenge,
      completionCount: 100,
      tags: ['coming-soon'],
    };

    render(
      <PracticeChallengeRow
        challenge={comingSoonChallenge}
        locale="en"
        labels={makeLabels(100)}
      />,
    );
    expect(screen.queryByTestId('challenge-row-solve-count')).toBeNull();
    expect(
      screen.queryByTestId('challenge-row-solve-count-placeholder'),
    ).toBeNull();

    cleanup();

    render(
      <PracticeChallengeGridCard
        challenge={comingSoonChallenge}
        locale="en"
        labels={makeLabels(100)}
      />,
    );
    expect(screen.queryByTestId('challenge-card-solve-count')).toBeNull();
  });
});
