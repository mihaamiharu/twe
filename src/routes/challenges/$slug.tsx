import { createFileRoute, Link, useParams, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChallengePlayground, type Challenge } from '@/components/challenges';
import { ChallengeSuccessDialog } from '@/components/challenges/ChallengeSuccessDialog';
import { deobfuscate } from '@/lib/obfuscator';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { type TestResult } from '@/components/challenges/TestResults';
import { useSession } from '@/lib/auth.client';
import { trackEvent } from '@/lib/analytics';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';
import { TierSkipTip } from '@/components/challenges/TierSkipTip';
import { getTierFromCategory, TIER_ORDER, tierLabels } from '@/lib/constants';
import { ChallengesResponse } from './index';
import { showAchievementToasts } from '@/lib/achievement-toast';

export const Route = createFileRoute('/challenges/$slug')({
    component: ChallengeDetailPage,
});

interface APIChallenge {
    id: string;
    slug: string;
    title: string;
    description: string;
    type: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category?: string;
    xpReward: number;
    instructions: string;
    htmlContent?: string;
    starterCode?: string;

    tags?: string[];
    testCases?: Array<{
        id: string;
        description: string;
        input: unknown;
        expectedOutput: unknown;
        order: number;
    }>;
    userProgress?: {
        isCompleted: boolean;
        attempts: number;
        lastAccessedAt: string;
    };
    nextChallenge?: {
        slug: string;
        title: string;
    } | null;
    tutorial?: {
        slug: string;
        title: string;
    } | null;
}

function ChallengeDetailPage() {
    const { slug } = useParams({ from: '/challenges/$slug' });
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showAuthGuard, setShowAuthGuard] = useState(false);
    const [lastSubmissionResult, setLastSubmissionResult] = useState<{
        xpEarned: number;
        achievements: { id: string; name: string; icon: string }[];
        levelUp?: { newLevel: number; title: string };
    } | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['challenge', slug],
        queryFn: async () => {
            const response = await fetch(`/api/challenges/${slug}`);
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('COMING_SOON');
                }
                throw new Error('Failed to fetch challenge');
            }
            const json = await response.json();
            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch challenge');
            }
            return json.data as APIChallenge;
        },
        enabled: !!slug,
        retry: (failureCount, error) => {
            // Don't retry if it's a 403/COMING_SOON error
            if (error.message === 'COMING_SOON') return false;
            return failureCount < 3;
        }
    });

    // Handle Coming Soon redirect
    useEffect(() => {
        if (error?.message === 'COMING_SOON') {
            toast.info('This challenge is coming soon!', {
                description: 'Stay tuned for updates on our roadmap.',
                duration: 4000
            });
            navigate({ to: '/challenges' });
        }
    }, [error, navigate]);

    const { data: allChallengesData } = useQuery<ChallengesResponse>({
        queryKey: ['challenges'],
        queryFn: async () => {
            const res = await fetch('/api/challenges?limit=100');
            if (!res.ok) throw new Error('Failed to fetch challenges');
            return res.json();
        },
    });

    const missingPrerequisites = useMemo(() => {
        if (!data || !allChallengesData) return [];

        const currentTier = getTierFromCategory(data.category);
        const currentTierIndex = TIER_ORDER.indexOf(currentTier);

        if (currentTierIndex <= 0) return []; // Basic tier has no prerequisites

        const missing = [];
        for (let i = 0; i < currentTierIndex; i++) {
            const prereqTier = TIER_ORDER[i];
            const tierChallenges = allChallengesData.data.filter((c: any) => getTierFromCategory(c.category) === prereqTier);
            const completedInTier = tierChallenges.filter((c: any) => c.isCompleted).length;

            if (tierChallenges.length > 0 && completedInTier < tierChallenges.length) {
                missing.push({
                    tier: prereqTier,
                    name: tierLabels[prereqTier].name
                });
            }
        }

        return missing;
    }, [data, allChallengesData]);

    const { data: sessionData } = useSession();
    const userId = sessionData?.user?.id;

    // Deobfuscate inputs if needed (for selector challenges)
    const testCases = useMemo(() => {
        if (!data?.testCases) return [];
        return data.testCases.map(tc => {
            const input = tc.input as { selector?: string; xpath?: string };
            const processedInput = { ...input };

            if (processedInput.selector) {
                processedInput.selector = deobfuscate(processedInput.selector);
            }
            if (processedInput.xpath) {
                processedInput.xpath = deobfuscate(processedInput.xpath);
            }

            return {
                ...tc,
                input: processedInput
            };
        });
    }, [data?.testCases]);

    // Transform API response to Challenge type expected by ChallengePlayground
    const challenge: Challenge | null = data ? {
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        type: data.type,
        difficulty: data.difficulty === 'EASY' ? 'Easy' : data.difficulty === 'MEDIUM' ? 'Medium' : 'Hard',
        xp: data.xpReward,
        instructions: data.instructions,
        htmlContent: data.htmlContent || '',
        starterCode: data.starterCode || '',
        targetSelector: (() => {
            if (!testCases.length) return '';

            // Try to find selector in the first test case input
            const firstTestInput = testCases[0].input as { selector?: string; xpath?: string };
            return firstTestInput?.selector || firstTestInput?.xpath || '';
        })(),

        testCases: testCases.map(tc => ({
            id: tc.id,
            name: tc.description,
            input: tc.input,
            expectedOutput: tc.expectedOutput
        })),
        isCompleted: data.userProgress?.isCompleted || false
    } : null;

    const submitMutation = useMutation({
        mutationFn: async (data: {
            challengeId: string;
            code: string;
            testResults: {
                testCaseId?: string;
                passed: boolean;
                output?: any;
                error?: string;
            }[];
            executionTime?: number;
        }) => {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit solution');
            }

            return await response.json();
        },
        onSuccess: (response) => {
            if (response.success && response.data) {
                setLastSubmissionResult({
                    xpEarned: response.data.submission.xpEarned,
                    achievements: response.data.newAchievements || [],
                    levelUp: response.data.levelUp,
                });
                setShowSuccessDialog(true);

                // Track analytics events
                if (data) {
                    trackEvent('challenge_completed', {
                        slug: data.slug,
                        difficulty: data.difficulty,
                        xp: response.data.submission.xpEarned,
                    });
                }

                // Track level-up if it occurred
                if (response.data.levelUp) {
                    trackEvent('level_up', {
                        newLevel: response.data.levelUp.newLevel,
                        totalXP: response.data.submission.xpEarned, // Note: This is XP earned, not total
                    });
                }

                // Track new achievements
                if (response.data.newAchievements?.length) {
                    for (const achievement of response.data.newAchievements) {
                        trackEvent('achievement_unlocked', {
                            slug: achievement.id,
                            name: achievement.name,
                        });
                    }
                    // Show toast notifications for new achievements
                    showAchievementToasts(response.data.newAchievements);
                }

                // Invalidate queries to refresh progress
                queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
            }
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = useCallback((data: {
        code: string;
        passed: boolean;
        testResults: TestResult[];
        executionTime?: number;
    }) => {
        if (!challenge) return;

        // Auth Guard: Check if user is logged in
        if (!sessionData?.user) {
            setShowAuthGuard(true);
            return;
        }

        if (!data.passed) {
            toast.error('Your solution did not pass all tests. Keep trying!');
            return;
        }

        const submissionData = {
            challengeSlug: challenge.slug,
            code: data.code,
            testResults: data.testResults.map(tr => ({
                testCaseId: tr.id !== 'main' && tr.id !== 'selector' ? tr.id : undefined,
                passed: tr.passed,
                output: tr.output,
                error: tr.error,
            })),
            executionTime: data.executionTime,
        };

        toast.promise(submitMutation.mutateAsync(submissionData), {
            loading: 'Submitting solution...',
            success: 'Solution submitted successfully!',
            error: 'Failed to submit solution',
        });
    }, [challenge, submitMutation, sessionData]);

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading challenge...</p>
                </div>
            </div>
        );
    }

    if (error || !challenge) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-4xl mx-auto">
                    <Card className="glass-card">
                        <CardContent className="py-12 text-center">
                            <h1 className="text-2xl font-bold mb-4">Challenge Not Found</h1>
                            <p className="text-muted-foreground mb-6">
                                {error?.message || 'The requested challenge could not be found.'}
                            </p>
                            <div className="flex items-center gap-4 mb-6 justify-center">
                                <Link to="/challenges">
                                    <Button variant="ghost" size="sm">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Challenges
                                    </Button>
                                </Link>
                                {data?.tutorial && (
                                    <>
                                        <div className="h-4 w-px bg-border" />
                                        <Link to="/tutorials/$slug" params={{ slug: data.tutorial.slug }}>
                                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                Review Tutorial: {data.tutorial.title}
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {missingPrerequisites.length > 0 && (
                <div className="px-6 pt-4">
                    <TierSkipTip
                        currentTier={tierLabels[getTierFromCategory(data?.category)].name}
                        missingPrerequisites={missingPrerequisites}
                    />
                </div>
            )}
            <div className="flex-1 min-h-0">
                <ChallengePlayground
                    challenge={challenge}
                    onSubmit={handleSubmit}
                    userId={userId}
                />
            </div>

            {lastSubmissionResult && (
                <ChallengeSuccessDialog
                    open={showSuccessDialog}
                    onClose={() => setShowSuccessDialog(false)}
                    xpEarned={lastSubmissionResult.xpEarned}
                    achievements={lastSubmissionResult.achievements}
                    levelUp={lastSubmissionResult.levelUp}
                    onRetry={() => setShowSuccessDialog(false)}
                    onNextChallenge={data?.nextChallenge ? () => {
                        setShowSuccessDialog(false);
                        navigate({ to: '/challenges/$slug', params: { slug: data.nextChallenge!.slug } });
                    } : undefined}
                />
            )}

            <AuthGuardDialog
                open={showAuthGuard}
                onOpenChange={setShowAuthGuard}
                title="Sign in to Submit"
                description="You need to be signed in to save your solution, earn XP, and track your progress. Your code will be preserved."
            />
        </div>
    );
}
