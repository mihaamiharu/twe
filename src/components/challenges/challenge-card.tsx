/**
 * ChallengeCard - Card component for displaying challenge in lists
 *
 * Features:
 * - Difficulty badge with color coding
 * - Challenge type icon
 * - XP reward display
 * - Completion status indicator
 * - Hover effects and click handling
 */

import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Code2,
  Palette,
  Route,
  Theater,
  CheckCircle2,
  Star,
  Users,
  ArrowRight,
  Target,
} from 'lucide-react';
import { localeSlugParams, LocaleRoutes } from '@/lib/navigation';

export type ChallengeType =
  | 'JAVASCRIPT'
  | 'TYPESCRIPT'
  | 'PLAYWRIGHT'
  | 'CSS_SELECTOR'
  | 'XPATH_SELECTOR'
  | 'SELECTOR';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ChallengeCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: Difficulty;
  xpReward: number;
  completionCount?: number;
  isCompleted?: boolean;
  tags?: string[];
  className?: string;
}

// Type icons mapping
const typeIcons: Record<ChallengeType, React.ReactNode> = {
  JAVASCRIPT: <Code2 className="h-4 w-4" />,
  TYPESCRIPT: <Code2 className="h-4 w-4 text-brand-orange" />,
  PLAYWRIGHT: <Theater className="h-4 w-4" />,
  CSS_SELECTOR: <Palette className="h-4 w-4" />,
  XPATH_SELECTOR: <Route className="h-4 w-4" />,
  SELECTOR: <Target className="h-4 w-4" />,
};

// Difficulty colors
const difficultyStyles: Record<
  Difficulty,
  { bg: string; text: string; border: string }
> = {
  EASY: {
    bg: 'bg-brand-success/10',
    text: 'text-brand-success',
    border: 'border-brand-success/20',
  },
  MEDIUM: {
    bg: 'bg-brand-warning/10',
    text: 'text-brand-warning',
    border: 'border-brand-warning/20',
  },
  HARD: {
    bg: 'bg-brand-error/10',
    text: 'text-brand-error',
    border: 'border-brand-error/20',
  },
};

export function ChallengeCard({
  slug,
  title,
  description,
  type,
  difficulty,
  xpReward,
  completionCount = 0,
  isCompleted = false,
  tags = [],
  className,
}: ChallengeCardProps) {
  const { t } = useTranslation(['challenges', 'common']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const diffStyle = difficultyStyles[difficulty];

  return (
    <Link
      to={LocaleRoutes.challengeDetail}
      params={localeSlugParams(locale, slug)}
    >
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:border-primary/50',
          isCompleted && 'border-brand-success/30 bg-brand-success/5',
          className,
        )}
      >
        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 rounded-sm bg-brand-success/10 px-2 py-1 text-xs font-medium text-brand-success">
              <CheckCircle2 className="h-3 w-3" />
              {t('challenges:status.completed')}
            </div>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Type Icon */}
            <div
              className={cn(
                'p-2 rounded-lg',
                'bg-primary/10 text-primary',
                'group-hover:bg-primary group-hover:text-primary-foreground',
                'transition-colors duration-300',
              )}
            >
              {typeIcons[type]}
            </div>

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {title}
              </h3>

              {/* Type Label */}
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(`challenges:types.${type.toLowerCase()}`)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          {/* Left: Difficulty & Stats */}
          <div className="flex items-center gap-3">
            {/* Difficulty Badge */}
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium',
                diffStyle.bg,
                diffStyle.text,
                diffStyle.border,
              )}
            >
              {t(`challenges:difficulty.${difficulty.toLowerCase()}`)}
            </Badge>

            {/* Completion Count */}
            {completionCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {completionCount.toLocaleString()}
              </div>
            )}
          </div>

          {/* Right: XP & Arrow */}
          <div className="flex items-center gap-3">
            {/* XP Reward */}
            <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              {xpReward} {t('common:labels.xp')}
            </div>

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ChallengeCard;
