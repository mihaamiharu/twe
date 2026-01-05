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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Code2,
    Palette,
    Route,
    Theater,
    CheckCircle2,
    Star,
    Users,
    ArrowRight,
} from 'lucide-react';
import { localeSlugParams, LocaleRoutes } from '@/lib/navigation';

export type ChallengeType = 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR';
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
    PLAYWRIGHT: <Theater className="h-4 w-4" />,
    CSS_SELECTOR: <Palette className="h-4 w-4" />,
    XPATH_SELECTOR: <Route className="h-4 w-4" />,
};

// Type labels
const typeLabels: Record<ChallengeType, string> = {
    JAVASCRIPT: 'JavaScript',
    PLAYWRIGHT: 'Playwright',
    CSS_SELECTOR: 'CSS Selector',
    XPATH_SELECTOR: 'XPath',
};

// Difficulty colors
const difficultyStyles: Record<Difficulty, { bg: string; text: string; border: string }> = {
    EASY: {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        border: 'border-green-500/20',
    },
    MEDIUM: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-500',
        border: 'border-yellow-500/20',
    },
    HARD: {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/20',
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
    const params = useParams({ strict: false }) as { locale?: string };
    const locale = params.locale || 'en';
    const diffStyle = difficultyStyles[difficulty];

    return (
        <Link to={LocaleRoutes.challengeDetail} params={localeSlugParams(locale, slug)}>
            <Card className={cn(
                'group relative overflow-hidden transition-all duration-300',
                'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
                'hover:-translate-y-1',
                isCompleted && 'border-green-500/30 bg-green-500/5',
                className
            )}>
                {/* Completion Badge */}
                {isCompleted && (
                    <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('challenges:status.completed')}
                        </div>
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className={cn(
                            'p-2 rounded-lg',
                            'bg-primary/10 text-primary',
                            'group-hover:bg-primary group-hover:text-primary-foreground',
                            'transition-colors duration-300'
                        )}>
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
                                diffStyle.border
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

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
        </Link>
    );
}

export default ChallengeCard;
