import { createFileRoute, useParams, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTutorial, completeTutorial, updateTutorialProgress } from '@/lib/tutorials.fn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { AlertCircle, Clock, ArrowLeft, CheckCircle2, ArrowRight, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { authQueryOptions } from '@/lib/auth.query';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';
import { showAchievementToasts } from '@/lib/achievement-toast';
import { TableOfContents, type TOCItem } from '@/components/tutorials/TableOfContents';

export const Route = createFileRoute('/$locale/tutorials/$slug')({
    component: TutorialDetailPage,
});

interface Tutorial {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    estimatedMinutes: number;
    tags: string[] | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    isPublished: boolean;
    order: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    userProgress: {
        isCompleted: boolean;
        readingProgress: number | null;
        lastAccessedAt: Date;
    } | null;
    nextTutorial: {
        slug: string;
        title: string;
    } | null;
    challenges: Array<{
        slug: string;
        title: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        type: string;
        xpReward: number;
        category: string | null;
    }>;
}

function TutorialDetailPage() {
    const { locale, slug } = useParams({ from: '/$locale/tutorials/$slug' });
    const { t } = useTranslation(['tutorials', 'common']);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [readingProgress, setReadingProgress] = useState(0);
    const [showAuthGuard, setShowAuthGuard] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const { data: auth } = useSuspenseQuery(authQueryOptions);
    const sessionData = auth; // Alias for compatibility

    const { data: tutorialData, isLoading, error } = useQuery({
        queryKey: ['tutorial', slug],
        queryFn: async () => {
            if (!slug) throw new Error('Tutorial slug is required');
            const result = await getTutorial({ data: { slug, locale } });
            if (!result.success) throw new Error(result.error);
            return result.data as Tutorial;
        },
    });

    // Rename for compatibility
    const tutorial = tutorialData;

    // Mark as complete mutation
    const markCompleteMutation = useMutation({
        mutationFn: async () => {
            const result = await completeTutorial({ data: { slug, locale } });
            if (!result.success) throw new Error(result.error);
            return result;
        },
        onSuccess: async (response) => {
            toast.success(t('tutorials:toasts.completed'));
            await queryClient.invalidateQueries({ queryKey: ['tutorial', slug] });
            await queryClient.invalidateQueries({ queryKey: ['tutorials'] });
            await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
            await queryClient.invalidateQueries({ queryKey: ['profile'] });
            await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

            // Show toast notifications for new achievements
            if (response?.newAchievements?.length) {
                showAchievementToasts(response.newAchievements);
            }
        },
        onError: () => {
            toast.error(t('tutorials:toasts.failed'));
        },
    });

    // Update progress mutation
    const updateProgressMutation = useMutation({
        mutationFn: async (progress: number) => {
            const result = await updateTutorialProgress({ data: { slug, readingProgress: progress } });
            if (!result.success) throw new Error(result.error);
            return result;
        },
    });

    // Use a ref to track progress for the event listener without re-binding
    const progressRef = useRef(readingProgress);
    // Track if user has actively scrolled (to prevent premature progress on page load)
    const hasScrolledRef = useRef(false);

    // Sync ref with state
    useEffect(() => {
        progressRef.current = readingProgress;
    }, [readingProgress]);

    // Track window scroll for reading progress
    useEffect(() => {
        // Don't update progress if tutorial is already completed or user not logged in
        if (tutorial?.userProgress?.isCompleted || !sessionData?.user) {
            return;
        }

        let scrollListenerAttached = false;

        const handleWindowScroll = () => {
            if (!contentRef.current) return;

            // Extra safety: if scroll position is inherited from previous page, ignore
            // This handles the race condition during SPA navigation
            if (!hasScrolledRef.current) {
                // Only start tracking after user has scrolled at least 50px from 0
                if (window.scrollY > 50) {
                    hasScrolledRef.current = true;
                } else {
                    return; // Don't calculate progress yet - user hasn't scrolled
                }
            }

            const element = contentRef.current;
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate distance from top of content to bottom of viewport
            const totalHeight = element.offsetHeight;
            const scrolled = Math.max(0, windowHeight - (rect.top + 100));

            let progress = Math.min(100, Math.round((scrolled / (totalHeight)) * 100));

            // Force 100% if we've reached the bottom of the content
            if (rect.bottom <= windowHeight + 100) {
                progress = 100;
            }

            // Only update if progress is genuinely increasing
            if (progress > progressRef.current) {
                setReadingProgress(progress);
                // Update progress in DB - only on significant milestones or 100%
                if ((progress % 20 === 0 || progress === 100)) {
                    updateProgressMutation.mutate(progress);
                }
            }
        };

        // Delay attaching the scroll listener to let the page settle after SPA navigation
        // This prevents the listener from firing with stale scrollY from the previous page
        const attachTimeout = setTimeout(() => {
            // Only attach if we're at the top of the page (scroll reset completed)
            if (window.scrollY === 0) {
                hasScrolledRef.current = false;
                window.addEventListener('scroll', handleWindowScroll);
                scrollListenerAttached = true;
            } else {
                // If still not at top, try again shortly
                const retryTimeout = setTimeout(() => {
                    hasScrolledRef.current = false;
                    window.addEventListener('scroll', handleWindowScroll);
                    scrollListenerAttached = true;
                }, 200);
                // Store for cleanup
                (attachTimeout as unknown as { retry?: ReturnType<typeof setTimeout> }).retry = retryTimeout;
            }
        }, 300);

        return () => {
            clearTimeout(attachTimeout);
            if ((attachTimeout as unknown as { retry?: ReturnType<typeof setTimeout> }).retry) {
                clearTimeout((attachTimeout as unknown as { retry?: ReturnType<typeof setTimeout> }).retry);
            }
            if (scrollListenerAttached) {
                window.removeEventListener('scroll', handleWindowScroll);
            }
        };
    }, [tutorial?.id, sessionData?.user, tutorial?.userProgress?.isCompleted]);



    // Reset progress and scroll to top when slug changes
    useEffect(() => {
        setReadingProgress(0);
        progressRef.current = 0; // Also reset the ref immediately
        hasScrolledRef.current = false; // Reset scroll tracking
        window.scrollTo(0, 0); // Force scroll to top
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [slug]);

    // Get display progress - always 100% for completed tutorials
    // Use nullish coalescing (??) so that 0 is not treated as falsy
    const displayProgress = tutorial?.userProgress?.isCompleted ? 100 : (readingProgress ?? tutorial?.userProgress?.readingProgress ?? 0);

    // Parse TOC
    const toc = useRef<TOCItem[]>([]);
    useEffect(() => {
        if (!tutorial?.content) return;

        const lines = tutorial.content.split('\n');
        const items: TOCItem[] = [];
        const slugify = (text: string) => text.toLowerCase().replace(/[^\w]+/g, '-');

        // Simple regex to find headers in code blocks to ignore them
        let inCodeBlock = false;

        lines.forEach(line => {
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }

            if (inCodeBlock) return;

            const h2Match = line.match(/^##\s+(.+)$/);
            const h3Match = line.match(/^###\s+(.+)$/);

            if (h2Match) {
                items.push({ id: slugify(h2Match[1]), text: h2Match[1], level: 2 });
            } else if (h3Match) {
                items.push({ id: slugify(h3Match[1]), text: h3Match[1], level: 3 });
            }
        });

        toc.current = items;
    }, [tutorial?.content]);

    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -66% 0px' }
        );

        const headings = document.querySelectorAll('h2, h3');
        headings.forEach((h) => observer.observe(h));

        return () => observer.disconnect();
    }, [tutorial?.content]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-8 w-32 mb-8" />
                    <Skeleton className="h-12 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-5/6 mb-8" />
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !tutorial) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <Link to="/$locale/tutorials" params={{ locale }}>
                        <Button variant="ghost" className="mb-8">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('common:actions.backToTutorials')}
                        </Button>
                    </Link>
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">{t('tutorials:page.notFound')}</h3>
                        <p className="text-muted-foreground mb-6">
                            {error?.message || t('tutorials:page.notFoundDescription')}
                        </p>
                        <Link to="/$locale/tutorials" params={{ locale }}>
                            <Button>{t('common:actions.browseTutorials')}</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isCompleted = tutorial.userProgress?.isCompleted || false;

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Back button - larger icon */}
                <Link to="/$locale/tutorials" params={{ locale }}>
                    <Button variant="ghost" className="mb-8">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        {t('common:actions.backToTutorials')}
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - No card wrapper, let it breathe */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Redesigned Header */}
                        <div className="flex flex-col items-center text-center space-y-8 mb-12 pt-8">
                            {/* Tags & Meta */}
                            <div className="flex items-center gap-3">
                                {tutorial.tags?.[0] && (
                                    <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold tracking-wider uppercase">
                                        {tutorial.tags[0]}
                                    </div>
                                )}
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span>•</span>
                                    <span>{t('card.estimatedTimeShort', { minutes: tutorial.estimatedMinutes })} read</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-4xl" style={{ fontFamily: 'var(--font-reading)' }}>
                                {tutorial.title}
                            </h1>

                            {/* Description */}
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                {tutorial.description}
                            </p>




                        </div>

                        {/* Content - Direct on page, no card container */}
                        <div
                            ref={contentRef}
                            className="prose prose-lg dark:prose-invert max-w-none scroll-smooth"
                            style={{
                                fontFamily: 'var(--font-reading)',
                                lineHeight: '1.8',
                            }}
                        >
                            <MarkdownRenderer content={tutorial.content} />
                        </div>
                    </div>

                    {/* Progress Sidebar - Sticky positioning with top offset for header */}
                    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                        {/* Table of Contents - Only show if there are items */}
                        {toc.current.length > 0 && (
                            <div className="hidden lg:block mb-6">
                                <TableOfContents headers={toc.current} activeId={activeId} />
                            </div>
                        )}

                        {/* Progress Card */}
                        <Card className="glass-card shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    {t('tutorials:sidebar.progress')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{t('tutorials:sidebar.reading')}</span>
                                        <span className="font-semibold text-primary">{displayProgress}%</span>
                                    </div>
                                    <Progress value={displayProgress} className="h-3" />
                                </div>

                                {/* Mark as Complete Button */}
                                {!isCompleted ? (
                                    <Button
                                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                                        onClick={() => {
                                            if (!sessionData?.user) {
                                                setShowAuthGuard(true);
                                                return;
                                            }
                                            markCompleteMutation.mutate();
                                        }}
                                        disabled={markCompleteMutation.isPending || displayProgress < 100}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        {markCompleteMutation.isPending ? t('common:messages.saving') : displayProgress < 100 ? t('tutorials:sidebar.readToComplete') : t('tutorials:sidebar.completeAndContinue')}
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30 shadow-sm">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="text-sm font-semibold text-green-500">{t('tutorials:sidebar.completedTitle')}</span>
                                        </div>
                                        {tutorial.nextTutorial && (
                                            <Button
                                                className="w-full"
                                                onClick={() => { void navigate({ to: '/$locale/tutorials/$slug', params: { locale, slug: tutorial.nextTutorial!.slug } }) }}
                                            >
                                                {t('tutorials:sidebar.nextLabel', { title: tutorial.nextTutorial.title })}
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Stats - Consolidated here only */}
                                <div className="pt-4 border-t space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{t('tutorials:sidebar.duration')}</span>
                                        </div>
                                        <span className="font-medium">{t('tutorials:card.estimatedTimeShort', { minutes: tutorial.estimatedMinutes })}</span>
                                    </div>
                                    {isCompleted && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="font-medium">{t('tutorials:sidebar.statusCompleted')}</span>
                                        </div>
                                    )}
                                </div>

                            </CardContent>
                        </Card>

                        {/* Linked Challenges List */}
                        {tutorial.challenges && tutorial.challenges.length > 0 && (
                            <Card className="glass-card shadow-lg border-primary/20">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        {t('tutorials:sidebar.challengesTitle')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        {t('tutorials:sidebar.challengesDescription')}
                                    </p>
                                    <div
                                        className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar"
                                        style={{
                                            maskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)',
                                            WebkitMaskImage: 'linear-gradient(to bottom, black 90%, transparent 100%)'
                                        }}
                                    >
                                        {tutorial.challenges.map(challenge => (
                                            <Link
                                                key={challenge.slug}
                                                to="/$locale/challenges/$slug"
                                                params={{ locale, slug: challenge.slug }}
                                                className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium group-hover:text-primary transition-colors">
                                                        {challenge.title}
                                                    </span>
                                                    <Badge variant={
                                                        challenge.difficulty === 'EASY' ? 'secondary' :
                                                            challenge.difficulty === 'MEDIUM' ? 'default' : 'destructive'
                                                    } className="text-[10px] h-5 px-1.5">
                                                        {t(`challenges:difficulty.${challenge.difficulty}`)}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {t(`challenges:types.${challenge.type.toLowerCase()}`)}
                                                    </span>
                                                    <span>{challenge.xpReward} XP</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom styles for better code snippet readability */}
            <style>{`
                    /* Hide H1 in markdown since we show title separately */
                    .prose h1 {
                        display: none;
                    }
                    
                    /* Better text contrast for dark mode */
                    .prose {
                        color: hsl(var(--foreground) / 0.95);
                    }
                    
                    .prose p {
                        color: hsl(var(--foreground) / 0.85);
                    }

                    .prose code {
                        background-color: hsl(var(--muted));
                        color: hsl(var(--foreground));
                        padding: 0.2em 0.4em;
                        border-radius: 0.25rem;
                        font-weight: 600;
                        font-size: 0.9em;
                    }

                    .prose pre {
                        background-color: hsl(var(--muted));
                        border: 1px solid hsl(var(--border));
                    }

                    .prose pre code {
                        background-color: transparent;
                        padding: 0;
                        font-weight: 400;
                    }

                    /* Table headers - Bold and dark for contrast */
                    .prose thead th {
                        font-weight: 700;
                        color: hsl(var(--foreground));
                        background-color: hsl(var(--muted));
                        border-bottom: 2px solid hsl(var(--border));
                    }

                    .prose tbody td {
                        border-bottom: 1px solid hsl(var(--border));
                    }
                    
                    /* Smooth scrollbar for sidebar */
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }

                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: hsl(var(--primary) / 0.1);
                        border-radius: 4px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: hsl(var(--primary) / 0.3);
                    }
                `}</style>

            <AuthGuardDialog
                open={showAuthGuard}
                onOpenChange={setShowAuthGuard}
                title={t('auth:guard.title')}
                description={t('auth:guard.description')}
            />
        </div>
    );
}
