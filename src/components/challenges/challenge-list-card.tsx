import { Link } from '@tanstack/react-router';
import { Trophy, Zap, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { difficultyColors } from '@/lib/constants';
import type { TFunction } from 'i18next';
import { ChallengeStateIndicator } from './challenge-state-indicator';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

export interface ChallengeListCardProps {
  challenge: {
    slug: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    xpReward: number;
    completionCount: number;
    isCompleted: boolean;
    tags?: string[] | null;
  };
  config: {
    color: string;
    icon: React.ReactNode;
  };
  isComingSoon: boolean;
  isBoss: boolean;
  params: { locale: string; slug: string };
  t: TFunction;
}

export function ChallengeListCard({
  challenge,
  config,
  isComingSoon,
  isBoss,
  params,
  t,
}: ChallengeListCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const state = isComingSoon
    ? 'locked'
    : challenge.isCompleted
      ? 'completed'
      : 'available';

  const CardContentWrapper = (
    <Card
      className={cn(
        'h-full transition-all duration-200 overflow-hidden border-border/50',
        isComingSoon
          ? 'opacity-60 bg-muted/20'
          : 'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 bg-card/50 hover:bg-card',
        isBoss &&
          !isComingSoon &&
          'border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:shadow-red-500/10',
        challenge.isCompleted &&
          !isComingSoon &&
          'bg-emerald-600/5 border-emerald-600/20',
      )}
    >
      <CardHeader className="p-5 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-medium border-transparent',
              isComingSoon ? 'bg-muted text-muted-foreground' : config.color,
            )}
          >
            {config.icon}
            <span className="ml-1.5">
              {t(`types.${challenge.type.toLowerCase()}`)}
            </span>
          </Badge>
          <ChallengeStateIndicator state={state} className="shrink-0" />
        </div>

        <div className="space-y-1.5">
          <CardTitle
            className={cn(
              'text-base font-bold leading-tight line-clamp-1',
              isBoss ? 'text-red-600 dark:text-red-400' : '',
            )}
          >
            {isBoss && (
              <Swords className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            )}
            {challenge.title}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2 min-h-[2.5em]">
            {challenge.description || t('labels.scenarioReady')}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex items-center justify-between mt-4">
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] h-5 font-medium',
              difficultyColors[challenge.difficulty],
            )}
          >
            {t(`difficulty.${challenge.difficulty}`)}
          </Badge>

          {!isComingSoon && (
            <div
              className="flex items-center gap-3 text-xs font-medium"
              aria-label={t('labels.rewardsAndCompletions')}
            >
              <div className="flex items-center gap-1 text-muted-foreground/70">
                <Trophy className="h-3.5 w-3.5" />
                <span>{challenge.completionCount}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>{challenge.xpReward}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isComingSoon) {
    return (
      <motion.div
        layout
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="cursor-not-allowed h-full"
      >
        {CardContentWrapper}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      className="h-full"
    >
      <Link
        to="/$locale/challenges/$slug"
        params={params}
        className="block h-full group outline-none"
      >
        {CardContentWrapper}
      </Link>
    </motion.div>
  );
}
