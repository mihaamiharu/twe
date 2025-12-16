import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Code, Trophy, Zap, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/challenges/')({
    component: ChallengesPage,
});

// Challenge type colors
const typeColors: Record<string, string> = {
    JAVASCRIPT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PLAYWRIGHT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    CSS_SELECTOR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    XPATH_SELECTOR: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// Difficulty colors
const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-500/20 text-green-400',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    HARD: 'bg-red-500/20 text-red-400',
};

interface Challenge {
    id: string;
    slug: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    xpReward: number;
    completionCount: number;
    isCompleted?: boolean;
    tags?: string[];
}

interface ChallengesResponse {
    success: boolean;
    data: Challenge[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

function ChallengesPage() {
    const { data, isLoading, error } = useQuery<ChallengesResponse>({
        queryKey: ['challenges'],
        queryFn: async () => {
            const res = await fetch('/api/challenges');
            if (!res.ok) throw new Error('Failed to fetch challenges');
            return res.json();
        },
    });

    const challenges = data?.data ?? [];

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Challenges</h1>
                    <p className="text-muted-foreground text-lg">
                        Test your skills with hands-on coding challenges
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary/20">All</Badge>
                    <Badge variant="outline" className={`cursor-pointer hover:bg-primary/20 ${typeColors.JAVASCRIPT}`}>JavaScript</Badge>
                    <Badge variant="outline" className={`cursor-pointer hover:bg-primary/20 ${typeColors.PLAYWRIGHT}`}>Playwright</Badge>
                    <Badge variant="outline" className={`cursor-pointer hover:bg-primary/20 ${typeColors.CSS_SELECTOR}`}>CSS Selector</Badge>
                    <Badge variant="outline" className={`cursor-pointer hover:bg-primary/20 ${typeColors.XPATH_SELECTOR}`}>XPath</Badge>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="h-full glass-card">
                                <CardHeader>
                                    <Skeleton className="h-6 w-24 mb-2" />
                                    <Skeleton className="h-8 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-full" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Failed to load challenges</h3>
                        <p className="text-muted-foreground">Please try again later</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && challenges.length === 0 && (
                    <div className="text-center py-12">
                        <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No challenges yet</h3>
                        <p className="text-muted-foreground">Check back soon for new challenges!</p>
                    </div>
                )}

                {/* Challenges Grid */}
                {!isLoading && !error && challenges.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {challenges.map((challenge) => (
                            <Link
                                key={challenge.slug}
                                to="/challenges/$slug"
                                params={{ slug: challenge.slug }}
                                className="group"
                            >
                                <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Code className="h-6 w-6 text-primary" />
                                                <Badge className={typeColors[challenge.type] || typeColors.JAVASCRIPT}>
                                                    {challenge.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={difficultyColors[challenge.difficulty] || ''}
                                            >
                                                {challenge.difficulty}
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                                            {challenge.title}
                                        </CardTitle>
                                        <CardDescription>{challenge.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Trophy className="h-4 w-4" />
                                                {challenge.completionCount.toLocaleString()} solved
                                            </div>
                                            <div className="flex items-center gap-1 text-accent">
                                                <Zap className="h-4 w-4" />
                                                {challenge.xpReward} XP
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
