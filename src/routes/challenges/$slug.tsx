import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChallengePlayground, type Challenge } from '@/components/challenges';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
        targetSelector: '', // Will be determined by test cases
        hints: data.hints?.map((hint, index) => ({
            id: String(index + 1),
            content: hint,
            xpCost: (index + 1) * 5,
        })) || [],
    } : null;

    const handleSubmit = useCallback((code: string, passed: boolean) => {
        if (passed) {
            console.log('Challenge passed! Code:', code);
            // TODO: Submit to API, award XP, etc.
            alert(`🎉 Congratulations! You earned ${challenge?.xp || 0} XP!`);
        }
    }, [challenge?.xp]);

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
        </div>
    );
}
