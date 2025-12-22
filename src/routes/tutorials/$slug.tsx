import { createFileRoute, useParams, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { AlertCircle, Clock, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { useSession } from '@/lib/auth.client';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';

export const Route = createFileRoute('/tutorials/$slug')({
    component: TutorialDetailPage,
});

interface Tutorial {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    estimatedMinutes: number;
    tags?: string[];
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    userProgress?: {
        isCompleted: boolean;
        readingProgress: number | null;
        lastAccessedAt: string;
    };
    nextTutorial?: {
        slug: string;
        title: string;
    } | null;
    challenges?: Array<{
        slug: string;
        title: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        type: string;
        xpReward: number;
        category: string;
    }>;
}

interface TutorialResponse {
    success: boolean;
    data: Tutorial;
}

function TutorialDetailPage() {
    const { slug } = useParams({ from: '/tutorials/$slug' });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [readingProgress, setReadingProgress] = useState(0);
    const [showAuthGuard, setShowAuthGuard] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const { data: sessionData } = useSession();

    const { data, isLoading, error } = useQuery<TutorialResponse>({
        queryKey: ['tutorial', slug],
        queryFn: async () => {
            const res = await fetch(`/api/tutorials/${slug}`);
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('Tutorial not found');
                }
                throw new Error('Failed to fetch tutorial');
            }
            return res.json();
        },
    });

    const tutorial = data?.data;

    // Mark as complete mutation
    const markCompleteMutation = useMutation({
        mutationFn: async () => {
            // Force progress to 100 on completion
            const res = await fetch(`/api/tutorials/${slug}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readingProgress: 100 }),
            });
            if (!res.ok) throw new Error('Failed to mark as complete');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Tutorial completed! 🎉');
            queryClient.invalidateQueries({ queryKey: ['tutorial', slug] });
            queryClient.invalidateQueries({ queryKey: ['tutorials'] });
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        },
        onError: () => {
            toast.error('Failed to mark as complete');
        },
    });

    // Update progress mutation
    const updateProgressMutation = useMutation({
        mutationFn: async (progress: number) => {
            const res = await fetch(`/api/tutorials/${slug}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ readingProgress: progress }),
            });
            if (!res.ok) throw new Error('Failed to update progress');
            return res.json();
        },
    });

    // Calculate reading progress based on scroll
    // Skip tracking if tutorial already completed
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        // Don't update progress if tutorial is already completed
        if (tutorial?.userProgress?.isCompleted) {
            return;
        }

        // Auth Guard: Don't track scrolling progress if not logged in (optional, but good for saving API calls)
        // But for "Lazy Registration", we might want to let them read fully, then prompt at the end?
        // Let's stick to prompt only on "Mark Complete" button for now.
        // Scroll progress doesn't need auth guard, but API call will fail (401)
        // We should check session before mutating.

        if (!sessionData?.user) return;

        const element = e.currentTarget;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight - element.clientHeight;

        // Ensure we can reach 100% - account for small rounding errors
        let progress = 0;
        if (scrollHeight <= 10) {
            // Content fits without scrolling or very minimal scroll needed
            progress = 100;
        } else {
            progress = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
            // If user is at or very near bottom, force 100%
            if (scrollHeight - scrollTop < 20) {
                progress = 100;
            }
        }

        if (progress !== readingProgress) {
            setReadingProgress(progress);
            // Update progress in DB (debounced) - only if not already completed
            if ((progress % 10 === 0 || progress === 100) && !tutorial?.userProgress?.isCompleted) {
                updateProgressMutation.mutate(progress);
            }
        }
    };

    // For short tutorials that don't need scrolling, auto-detect on mount
    useEffect(() => {
        if (!tutorial || tutorial.userProgress?.isCompleted) {
            return;
        }

        // Check if content needs scrolling after render
        const checkContentHeight = () => {
            if (contentRef.current) {
                const element = contentRef.current;
                const scrollHeight = element.scrollHeight - element.clientHeight;

                // If content doesn't need scrolling, set progress to 100%
                if (scrollHeight <= 10) {
                    setReadingProgress(100);
                    // Also trigger mutation for consistency
                    updateProgressMutation.mutate(100);
                }
            }
        };

        // Small delay to ensure content is rendered
        const timer = setTimeout(checkContentHeight, 500);
        return () => clearTimeout(timer);
    }, [tutorial?.id]); // Only run when tutorial ID changes

    // Reset progress and scroll to top when slug changes
    useEffect(() => {
        setReadingProgress(0);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [slug]);

    // Get display progress - always 100% for completed tutorials
    const displayProgress = tutorial?.userProgress?.isCompleted ? 100 : readingProgress || tutorial?.userProgress?.readingProgress || 0;

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
                    <Link to="/tutorials">
                        <Button variant="ghost" className="mb-8">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Tutorials
                        </Button>
                    </Link>
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Tutorial not found</h3>
                        <p className="text-muted-foreground mb-6">
                            {error?.message || 'The tutorial you are looking for does not exist'}
                        </p>
                        <Link to="/tutorials">
                            <Button>Browse All Tutorials</Button>
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
                <Link to="/tutorials">
                    <Button variant="ghost" className="mb-8">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Tutorials
                    </Button>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - No card wrapper, let it breathe */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Streamlined Header - Only once, with gradient */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                {tutorial.tags?.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                                {tutorial.title}
                            </h1>
                            <p className="text-xl text-muted-foreground">
                                {tutorial.description}
                            </p>
                        </div>

                        {/* Content - Direct on page, no card container */}
                        <div
                            ref={contentRef}
                            className="prose prose-lg dark:prose-invert max-w-none max-h-[70vh] overflow-y-auto pr-4 scroll-smooth"
                            style={{
                                lineHeight: '1.7',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'hsl(var(--primary) / 0.3) transparent'
                            }}
                            onScroll={handleScroll}
                        >
                            <MarkdownRenderer content={tutorial.content} />
                        </div>
                    </div>

                    {/* Progress Sidebar - Sticky positioning */}
                    <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                        {/* Progress Card */}
                        <Card className="glass-card shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    Your Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Reading</span>
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
                                        {markCompleteMutation.isPending ? 'Saving...' : displayProgress < 100 ? 'Read to Complete' : 'Complete & Continue'}
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border-2 border-green-500/30 shadow-sm">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="text-sm font-semibold text-green-500">Completed! 🎉</span>
                                        </div>
                                        {data.data.nextTutorial && (
                                            <Button
                                                className="w-full"
                                                onClick={() => navigate({ to: '/tutorials/$slug', params: { slug: data.data.nextTutorial!.slug } })}
                                            >
                                                Next: {data.data.nextTutorial.title}
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
                                            <span>Duration</span>
                                        </div>
                                        <span className="font-medium">{tutorial.estimatedMinutes} min</span>
                                    </div>
                                    {isCompleted && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="font-medium">Completed</span>
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
                                        Practice Challenges
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Reinforce what you've learned with these related challenges.
                                    </p>
                                    <div className="space-y-3">
                                        {tutorial.challenges.map(challenge => (
                                            <Link
                                                key={challenge.slug}
                                                to="/challenges/$slug"
                                                params={{ slug: challenge.slug }}
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
                                                        {challenge.difficulty}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        {challenge.type.replace('_', ' ')}
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
                    
                    /* Pro Tip / Blockquote - Distinctive dark mode styling */
                    .dark .prose blockquote {
                        background-color: rgb(124 58 237 / 0.2);
                        border-left: 4px solid hsl(var(--primary));
                        padding: 1rem 1.5rem;
                        margin: 1.5rem 0;
                        border-radius: 0.5rem;
                        border: 1px solid rgb(124 58 237 / 0.3);
                    }
                    
                    /* Pro Tip / Blockquote - Distinctive styling */
                    .prose blockquote {
                        background-color: hsl(var(--primary) / 0.05);
                        border-left: 4px solid hsl(var(--primary));
                        padding: 1rem 1.5rem;
                        margin: 1.5rem 0;
                        border-radius: 0.5rem;
                        font-style: normal;
                    }
                    
                    .prose blockquote p {
                        margin: 0;
                        color: hsl(var(--foreground) / 0.95);
                    }
                    
                    .prose blockquote strong {
                        color: hsl(var(--primary));
                        font-weight: 700;
                    }

                    /* Smooth scrollbar */
                    .prose::-webkit-scrollbar {
                        width: 8px;
                    }

                    .prose::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    
                    .prose::-webkit-scrollbar-thumb {
                        background: hsl(var(--primary) / 0.3);
                        border-radius: 4px;
                    }
                    
                    .prose::-webkit-scrollbar-thumb:hover {
                        background: hsl(var(--primary) / 0.5);
                    }
                `}</style>

            <AuthGuardDialog
                open={showAuthGuard}
                onOpenChange={setShowAuthGuard}
                title="Sign to Save Progress"
                description="You need to be signed in to mark tutorials as complete and track your learning journey."
            />
        </div>
    );
}
