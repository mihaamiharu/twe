export const tutorialStages = [
  'foundations',
  'beginner',
  'intermediate',
  'advanced',
] as const;

export type TutorialStage = (typeof tutorialStages)[number] | 'other';

export interface TutorialListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  tags: string[];
  order: number;
  viewCount: number;
  isCompleted: boolean;
  readingProgress: number;
}

export function getTutorialStage(tags: string[] = []): TutorialStage {
  const stage = tags.find((tag) =>
    tutorialStages.includes(
      tag.toLowerCase() as (typeof tutorialStages)[number],
    ),
  );

  return stage
    ? (stage.toLowerCase() as Exclude<TutorialStage, 'other'>)
    : 'other';
}

export function isTutorialTopic(tag: string): boolean {
  return !tutorialStages.includes(
    tag.toLowerCase() as (typeof tutorialStages)[number],
  );
}
