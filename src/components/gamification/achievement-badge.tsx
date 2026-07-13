/**
 * AchievementBadge - Achievement display with icon and progress
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  Achievement,
  AchievementCriteria,
  UserStats,
} from '@/lib/achievements';
import { getAchievementProgress } from '@/lib/achievements';
import { Lock, Check, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type AchievementDisplay = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  criteria?: AchievementCriteria;
};

export interface AchievementBadgeProps {
  achievement: AchievementDisplay;
  earned?: boolean;
  earnedAt?: Date;
  stats?: UserStats;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export function AchievementBadge({
  achievement,
  earned = false,
  earnedAt,
  stats,
  showProgress = true,
  size = 'md',
  className,
  style,
}: AchievementBadgeProps) {
  const { t, i18n } = useTranslation('profile');
  const progress =
    stats && achievement.criteria
      ? getAchievementProgress(achievement as Achievement, stats)
      : null;

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all',
        earned
          ? 'border-[color:var(--quest-gold)]/45 bg-[color:var(--quest-gold)]/10'
          : 'opacity-70 grayscale border-border bg-card',
        className,
      )}
      style={style}
    >
      <CardContent className={cn(sizeClasses[size])}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center rounded-lg bg-muted/50 p-2',
              earned ? 'bg-[color:var(--quest-gold)]/20' : '',
            )}
          >
            <span className={iconSizes[size]} aria-hidden="true">
              {achievement.icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-semibold truncate',
                  size === 'sm' && 'text-sm',
                )}
              >
                {achievement.name}
              </h3>
              {earned ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--quest-success)]">
                  <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {t('achievements.unlocked')}
                </span>
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            <p
              className={cn(
                'text-muted-foreground',
                size === 'sm' ? 'text-xs' : 'text-sm',
              )}
            >
              {achievement.description}
            </p>

            {/* XP Reward */}
            <div className="flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3 text-primary" aria-hidden="true" />
              <span className="text-xs text-primary">
                +{achievement.xpReward} XP
              </span>
            </div>

            {/* Progress bar */}
            {showProgress && !earned && progress && (
              <div className="mt-2">
                <Progress value={progress.percentage} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.current} / {progress.target}
                </p>
              </div>
            )}

            {/* Earned date */}
            {earned && earnedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                {t('achievements.earnedOn', {
                  date: earnedAt.toLocaleDateString(i18n.language),
                })}
              </p>
            )}
          </div>
        </div>

        {/* Badge */}
        <Badge
          variant="outline"
          className={cn(
            'absolute top-2 right-2',
            earned
              ? 'bg-[color:var(--quest-gold)]/15 text-foreground border-[color:var(--quest-gold)]/35'
              : 'bg-muted',
          )}
        >
          {achievement.category.toLowerCase()}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default AchievementBadge;
