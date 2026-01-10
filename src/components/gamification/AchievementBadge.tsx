/**
 * AchievementBadge - Achievement display with icon and progress
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Achievement, UserStats } from '@/lib/achievements';
import { getAchievementProgress } from '@/lib/achievements';
import { Lock, Check, Zap } from 'lucide-react';

export interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  earnedAt?: Date;
  stats?: UserStats;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AchievementBadge({
  achievement,
  earned = false,
  earnedAt,
  stats,
  showProgress = true,
  size = 'md',
  className,
}: AchievementBadgeProps) {
  const progress = stats ? getAchievementProgress(achievement, stats) : null;

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
        'glass-card relative overflow-hidden transition-all',
        earned
          ? 'border-yellow-500/30 bg-yellow-500/5'
          : 'opacity-70 grayscale',
        className,
      )}
    >
      <CardContent className={cn(sizeClasses[size])}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center rounded-lg bg-muted/50 p-2',
              earned ? 'bg-yellow-500/20' : '',
            )}
          >
            <span className={iconSizes[size]}>{achievement.icon}</span>
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
                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
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
              <Zap className="h-3 w-3 text-accent" />
              <span className="text-xs text-accent">
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
                Earned {earnedAt.toLocaleDateString()}
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
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
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
