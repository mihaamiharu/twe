import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChallengePlayground, type Challenge } from '@/components/challenges';
import { ChallengeSuccessDialog } from '@/components/challenges/ChallengeSuccessDialog';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';
import { type TestResult } from '@/components/challenges/TestResults';

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
    xpReward: number;
    instructions: string;
    htmlContent?: string;
    starterCode?: string;
    hints?: string[];
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
}

function ChallengeDetailPage() {
    const { slug } = useParams({ from: '/challenges/$slug' });
    const queryClient = useQueryClient();
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [lastSubmissionResult, setLastSubmissionResult] = useState<{
        xpEarned: number;
        achievements: string[];
        levelUp?: { newLevel: number; title: string };
    } | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['challenge', slug],
        queryFn: async () => {
            const response = await fetch(`/api/challenges/${slug}`);
            if (!response.ok) {
                throw new Error('Failed to fetch challenge');
            }
            const json = await response.json();
            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch challenge');
            }
            return json.data as APIChallenge;
        },
        enabled: !!slug,
    });

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
            if (!data.testCases?.length) return '';

            // Try to find selector in the first test case input
            const firstTestInput = data.testCases[0].input as { selector?: string; xpath?: string };
            return firstTestInput?.selector || firstTestInput?.xpath || '';
        })(),
        hints: data.hints?.map((hint, index) => ({
            id: String(index + 1),
            content: hint,
            xpCost: (index + 1) * 5,
        })) || [],
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
                    xpEarned: response.data.xpEarned,
                    achievements: response.data.newAchievements || [],
                    levelUp: response.data.levelUp,
                });
                setShowSuccessDialog(true);
                // Invalidate queries to refresh progress
                queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
                queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
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

        if (!data.passed) {
            toast.error('Your solution did not pass all tests. Keep trying!');
            return;
        }

        const submissionData = {
            challengeId: challenge.id,
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
    }, [challenge, submitMutation]);

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
                            <Link
                                to="/challenges"
                                className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Challenges
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)]">
            <ChallengePlayground challenge={challenge} onSubmit={handleSubmit} />

            {lastSubmissionResult && (
                <ChallengeSuccessDialog
                    open={showSuccessDialog}
                    onClose={() => setShowSuccessDialog(false)}
                    xpEarned={lastSubmissionResult.xpEarned}
                    achievements={lastSubmissionResult.achievements}
                    levelUp={lastSubmissionResult.levelUp}
                    onRetry={() => setShowSuccessDialog(false)}
                // onNextChallenge would go here if we implemented next logic
                />
            )}
        </div>
    );
}
