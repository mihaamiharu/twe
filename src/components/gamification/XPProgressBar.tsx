/**
 * XPProgressBar - Animated XP progress indicator
 */

import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getLevelProgress, getLevelTitle, formatXP } from '@/lib/gamification';
import { Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface XPProgressBarProps {
    totalXP: number;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function XPProgressBar({
    totalXP,
    showDetails = true,
    size = 'md',
    className,
}: XPProgressBarProps) {
    const { t } = useTranslation(['common']);
    const progress = useMemo(() => getLevelProgress(totalXP), [totalXP]);
    const titleKey = useMemo(() => getLevelTitle(progress.currentLevel), [progress.currentLevel]);
    const title = t(`common:levelTitles.${titleKey}`);

    const sizeClasses = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className={cn('space-y-2', className)}>
            {showDetails && (
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-semibold">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span>{t('common:labels.level')} {progress.currentLevel}</span>
                        </div>
                        <span className="text-muted-foreground">{title}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="h-3 w-3 text-accent" />
                        <span>{formatXP(totalXP)} XP</span>
                    </div>
                </div>
            )}

            <div className="relative">
                <Progress
                    value={progress.progress}
                    className={cn(sizeClasses[size])}
                />
                {showDetails && (
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatXP(progress.xpInCurrentLevel)} XP</span>
                        <span>{t('challenges:success.xpToNext', { xp: formatXP(progress.nextLevelXP - progress.currentLevelXP), defaultValue: `${formatXP(progress.nextLevelXP - progress.currentLevelXP)} XP to next` })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default XPProgressBar;
