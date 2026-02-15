import { useTranslation } from 'react-i18next';
import {
    Play,
    Send,
    BookOpen,
    Lightbulb,
    Zap,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Info
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { localeSlugParams, LocaleRoutes } from '@/lib/navigation';
import type { Challenge } from './types';

interface PlaygroundHeaderProps {
    challenge: Challenge;
    locale: string;
    userId?: string;
    isMobile: boolean;
    isCodeChallenge: boolean;
    isRunning: boolean;
    hasPassed: boolean;
    hintUsed: boolean;
    isHintPending: boolean;
    onRunCode: () => void;
    onOpenHintDialog: () => void;
    onSubmit: () => void;
}

export function PlaygroundHeader({
    challenge,
    locale,
    userId,
    isMobile,
    isCodeChallenge,
    isRunning,
    hasPassed,
    hintUsed,
    isHintPending,
    onRunCode,
    onOpenHintDialog,
    onSubmit,
}: PlaygroundHeaderProps) {
    const { t } = useTranslation(['challenges', 'common']);

    return (
        <div className="border-b border-border bg-card px-3 md:px-4 py-2 md:py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                <div className="min-w-0">
                    <h1 className="font-bold text-base md:text-xl tracking-tight text-foreground truncate">
                        {challenge.title}
                    </h1>
                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 flex-wrap">
                        <Badge
                            variant="secondary"
                            className="font-bold border border-border/50"
                        >
                            {t(`challenges:difficulty.${challenge.difficulty.toUpperCase()}`)}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="font-bold border-border/50 bg-background"
                        >
                            {t(`challenges:types.${challenge.type?.toLowerCase() || 'unknown'}`)}
                        </Badge>
                        <span className="text-accent flex items-center gap-1 font-bold">
                            <Zap className="h-3 w-3 fill-current" />
                            {challenge.xp} XP
                        </span>
                    </div>
                    {(challenge.type === 'PLAYWRIGHT' || challenge.type === 'TYPESCRIPT') && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 mt-0.5 cursor-help opacity-80 hover:opacity-100 transition-opacity">
                                        <Info className="h-3 w-3 text-amber-500" />
                                        <span className="text-[11px] text-muted-foreground border-b border-dotted border-muted-foreground/50">
                                            {t('challenges:playground.shimNote')}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start" className="max-w-[260px] text-xs">
                                    <p>{challenge.type === 'TYPESCRIPT' ? t('challenges:playground.shimDescriptionTS') : t('challenges:playground.shimDescription')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
                <div className="flex items-center mr-1 md:mr-2 bg-muted/30 rounded-lg p-0.5 border border-border/50">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!challenge.prevChallenge}
                        onClick={() => {
                            if (challenge.prevChallenge) {
                                window.location.href = `/${locale}/challenges/${challenge.prevChallenge.slug}`;
                            }
                        }}
                        className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
                        title={challenge.prevChallenge ? t('common:actions.previous') : undefined}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border/50 mx-0.5" />
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={!challenge.nextChallenge}
                        onClick={() => {
                            if (challenge.nextChallenge) {
                                window.location.href = `/${locale}/challenges/${challenge.nextChallenge.slug}`;
                            }
                        }}
                        className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
                        title={challenge.nextChallenge ? t('common:actions.next') : undefined}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {isMobile && isCodeChallenge && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRunCode}
                        disabled={isRunning}
                        className="font-bold border-brand-teal text-brand-teal-dark hover:bg-brand-teal/10"
                    >
                        {isRunning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                    </Button>
                )}

                {challenge.tutorial && (
                    <Link
                        to={LocaleRoutes.tutorialDetail}
                        params={localeSlugParams(locale, challenge.tutorial.slug)}
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex font-bold text-muted-foreground hover:text-foreground"
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            {t('common:navigation.tutorials')}
                        </Button>
                    </Link>
                )}

                {challenge.hints && challenge.hints.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-bold border border-border/50 text-muted-foreground hover:text-foreground h-8 md:h-9 px-2 md:px-3"
                            >
                                <Lightbulb className="h-4 w-4 md:mr-2 text-yellow-500" />
                                <span className="hidden md:inline">{t('challenges:hints.title', 'Hints')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px]">
                            <DropdownMenuLabel>{t('challenges:hints.availableHints', 'Available Hints')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {challenge.hints.map((hint, i) => (
                                <DropdownMenuItem key={i} className="text-xs break-words whitespace-normal p-3 focus:bg-muted">
                                    <span className="font-bold mr-2 text-muted-foreground">{i + 1}.</span>
                                    {hint}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {!challenge.isCompleted && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenHintDialog}
                                    disabled={isHintPending || !userId}
                                    className={cn(
                                        'font-bold border transition-all h-8 md:h-9 px-2 md:px-3',
                                        hintUsed
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                                            : !userId
                                                ? 'bg-amber-500/5 border-amber-500/20 text-amber-600/60 cursor-default opacity-80'
                                                : 'border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500',
                                    )}
                                >
                                    {isHintPending ? (
                                        <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
                                    ) : (
                                        <Lightbulb className="h-4 w-4 md:mr-2" />
                                    )}
                                    <span className="hidden md:inline">
                                        {hintUsed ? t('challenges:hints.used') : t('challenges:hints.button')}
                                    </span>
                                    {!hintUsed && (
                                        <Badge variant="secondary" className="hidden md:flex ml-2 bg-amber-500/20 text-amber-700 text-xs">
                                            {t('challenges:hints.penalty')}
                                        </Badge>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {!userId
                                    ? t('challenges:hints.loginRequired')
                                    : hintUsed
                                        ? t('challenges:hints.showAgain', 'Show Hint Again')
                                        : t('challenges:hints.warning')
                                }
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                onClick={onSubmit}
                                disabled={!hasPassed}
                                className={cn(
                                    'font-bold border border-border transition-all h-8 md:h-9 px-2 md:px-3',
                                    hasPassed
                                        ? 'bg-green-500 hover:bg-green-600 text-black'
                                        : 'bg-muted text-muted-foreground disabled:opacity-100 cursor-not-allowed',
                                )}
                                title={!hasPassed ? t('common:actions.submit') : undefined}
                            >
                                <Send className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">{t('common:actions.submit')}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Submit solution (⌘/Ctrl + Shift + Enter)</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
