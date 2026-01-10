/**
 * Achievement Toast Notifications
 *
 * Helper functions to display achievement unlocked notifications.
 */

import { toast } from 'sonner';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  xpReward?: number;
}

/**
 * Show a toast notification for a newly earned achievement
 */
export function showAchievementToast(achievement: Achievement) {
  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-2xl"> {achievement.icon} </span>
      <div>
        <div className="font-semibold"> Achievement Unlocked! </div>
        <div className="text-sm text-muted-foreground">
          {' '}
          {achievement.name}{' '}
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      className: 'achievement-toast',
    },
  );
}

/**
 * Show toast notifications for multiple achievements
 */
export function showAchievementToasts(achievements: Achievement[]) {
  // Stagger the toasts slightly for better UX
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementToast(achievement);
    }, index * 500);
  });
}
