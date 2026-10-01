import { getLevelProgress } from '@/lib/gamification';

/** Keep profile fields aligned with the level calculation used by XP rewards. */
export function getUserXPProgress(totalXP: number) {
  const progress = getLevelProgress(totalXP);

  return {
    level: progress.currentLevel,
    xpProgress: progress.xpInCurrentLevel,
    xpNeeded: progress.nextLevelXP - progress.currentLevelXP,
    xpProgressPercentage: progress.progress,
  };
}
