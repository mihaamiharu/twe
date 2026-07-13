export interface JournalChallenge {
  slug: string;
  title: string;
  type: string;
  difficulty: string;
  xpReward: number;
  order: number;
  tags?: string[] | null;
}

export interface JournalTutorial {
  slug: string;
  title: string;
  estimatedMinutes: number;
  tags: string[];
  order: number;
}

export function selectRecommendedChallenge(
  challenges: JournalChallenge[],
  completedSlugs: Set<string>,
): JournalChallenge | null {
  return (
    [...challenges]
      .sort((a, b) => a.order - b.order)
      .find(
        (challenge) =>
          !completedSlugs.has(challenge.slug) &&
          !challenge.tags?.includes('coming-soon'),
      ) ?? null
  );
}

export function selectContinueTutorial(
  tutorials: JournalTutorial[],
  completedSlugs: Set<string>,
): JournalTutorial | null {
  return (
    [...tutorials]
      .sort((a, b) => a.order - b.order)
      .find((tutorial) => !completedSlugs.has(tutorial.slug)) ?? null
  );
}

export function getChallengeTypeTotals(
  challenges: Pick<JournalChallenge, 'type'>[],
): Record<string, number> {
  return challenges.reduce<Record<string, number>>((totals, challenge) => {
    totals[challenge.type] = (totals[challenge.type] || 0) + 1;
    return totals;
  }, {});
}
