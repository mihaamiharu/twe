import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Code, Trophy, Zap, AlertCircle, CheckCircle2, Palette, Route as RouteIcon } from 'lucide-react';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/challenges/')({
    component: ChallengesPage,
});

// Challenge type colors and icons
const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    JAVASCRIPT: {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: <Code className="h-4 w-4" />,
        label: 'JavaScript',
    },
    PLAYWRIGHT: {
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: <Code className="h-4 w-4" />,
        label: 'Playwright',
    },
    CSS_SELECTOR: {
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: <Palette className="h-4 w-4" />,
        label: 'CSS Selector',
    },
    XPATH_SELECTOR: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: <RouteIcon className="h-4 w-4" />,
        label: 'XPath',
    },
};

// Category labels - expanded for all tiers
const categoryLabels: Record<string, string> = {
    // Tier 1: Basic (Selectors)
    'css-basics': '📘 CSS Basics',
    'xpath-basics': '📙 XPath Basics',
    'selector-comparison': '📗 CSS vs XPath',
    // Tier 2: Beginner (JavaScript)
    'javascript': '📒 JavaScript Fundamentals',
    'dom': '📓 DOM Understanding',
    'async-await': '📔 Async/Await',
    // Tier 3: Intermediate (Playwright Basics)
    'playwright-navigation': '🎭 Navigation & Actions',
    'playwright-locators': '🔍 Locators',
    'playwright-assertions': '✅ Assertions',
    'playwright-waits': '⏳ Wait Strategies',
    // Tier 4: Expert (Advanced)
    'playwright-pom': '🏗️ Page Object Model',
    'playwright-data-driven': '📊 Data-Driven Testing',
    'playwright-advanced': '🚀 Advanced Patterns',
};

// Tier labels
const tierLabels: Record<string, { name: string; color: string }> = {
    basic: { name: '🟢 Basic', color: 'text-green-400' },
    beginner: { name: '🟡 Beginner', color: 'text-yellow-400' },
    intermediate: { name: '🟠 Intermediate', color: 'text-orange-400' },
    expert: { name: '🔴 Expert', color: 'text-red-400' },
};

// Get tier from category
function getTierFromCategory(category?: string): string {
    if (!category) return 'basic';
    if (category.startsWith('css-') || category.startsWith('xpath-') || category.startsWith('selector')) return 'basic';
    if (category === 'javascript' || category === 'dom' || category === 'async-await') return 'beginner';
    if (category.startsWith('playwright-navigation') || category.startsWith('playwright-locators') ||
        category.startsWith('playwright-assertions') || category.startsWith('playwright-waits')) return 'intermediate';
    if (category.startsWith('playwright-pom') || category.startsWith('playwright-data') ||
        category.startsWith('playwright-advanced')) return 'expert';
    return 'basic';
}

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
    category?: string;
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
    const [filterType, setFilterType] = useState<string>('all');
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [filterTier, setFilterTier] = useState<string>('all');

    const { data, isLoading, error } = useQuery<ChallengesResponse>({
        queryKey: ['challenges'],
        queryFn: async () => {
            const res = await fetch('/api/challenges?limit=100');
            if (!res.ok) throw new Error('Failed to fetch challenges');
            return res.json();
        },
    });

    const challenges = data?.data ?? [];

    // Filter challenges by type, difficulty, and tier
    const filteredChallenges = useMemo(() => {
        return challenges.filter(c => {
            if (filterType !== 'all' && c.type !== filterType) return false;
            if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
            if (filterTier !== 'all' && getTierFromCategory(c.category) !== filterTier) return false;
            return true;
        });
    }, [challenges, filterType, filterDifficulty, filterTier]);

    // Group challenges by category
    const challengesByCategory = useMemo(() => {
        const groups: Record<string, Challenge[]> = {};

        for (const challenge of filteredChallenges) {
            const category = challenge.category || 'uncategorized';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(challenge);
        }

        // Sort by order within each category
        for (const category in groups) {
            groups[category].sort((a, b) => (a as any).order - (b as any).order);
        }

        return groups;
    }, [filteredChallenges]);

    // Calculate progress
    const totalChallenges = challenges.length;
    const completedChallenges = challenges.filter(c => c.isCompleted).length;
    const progressPercent = totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0;

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Challenges</h1>
                    <p className="text-muted-foreground text-lg">
                        Master CSS and XPath selectors with hands-on challenges
                    </p>
                </div>

                {/* Progress Bar */}
                {totalChallenges > 0 && (
                    <div className="mb-8 p-4 rounded-lg bg-card border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Overall Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {completedChallenges} / {totalChallenges} completed ({progressPercent}%)
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="space-y-4 mb-8">
                    {/* Type Filter */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground self-center mr-2">Type:</span>
                        <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${filterType === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </Badge>
                        {Object.entries(typeConfig).map(([type, config]) => {
                            const count = challenges.filter(c => c.type === type).length;
                            if (count === 0) return null;
                            return (
                                <Badge
                                    key={type}
                                    variant="outline"
                                    className={`cursor-pointer transition-all ${filterType === type ? config.color : 'hover:bg-primary/20'}`}
                                    onClick={() => setFilterType(type)}
                                >
                                    {config.icon}
                                    <span className="ml-1">{config.label} ({count})</span>
                                </Badge>
                            );
                        })}
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground self-center mr-2">Difficulty:</span>
                        <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${filterDifficulty === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
                            onClick={() => setFilterDifficulty('all')}
                        >
                            All
                        </Badge>
                        {['EASY', 'MEDIUM', 'HARD'].map(diff => {
                            const count = challenges.filter(c => c.difficulty === diff).length;
                            if (count === 0) return null;
                            return (
                                <Badge
                                    key={diff}
                                    variant="outline"
                                    className={`cursor-pointer transition-all ${filterDifficulty === diff ? difficultyColors[diff] : 'hover:bg-primary/20'}`}
                                    onClick={() => setFilterDifficulty(diff)}
                                >
                                    {diff} ({count})
                                </Badge>
                            );
                        })}
                    </div>

                    {/* Tier Filter */}
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground self-center mr-2">Tier:</span>
                        <Badge
                            variant="outline"
                            className={`cursor-pointer transition-all ${filterTier === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
                            onClick={() => setFilterTier('all')}
                        >
                            All Tiers
                        </Badge>
                        {Object.entries(tierLabels).map(([tier, { name, color }]) => {
                            const count = challenges.filter(c => getTierFromCategory(c.category) === tier).length;
                            if (count === 0) return null;
                            return (
                                <Badge
                                    key={tier}
                                    variant="outline"
                                    className={`cursor-pointer transition-all ${filterTier === tier ? `bg-${tier === 'basic' ? 'green' : tier === 'beginner' ? 'yellow' : tier === 'intermediate' ? 'orange' : 'red'}-500/20 ${color}` : 'hover:bg-primary/20'}`}
                                    onClick={() => setFilterTier(tier)}
                                >
                                    {name} ({count})
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="h-full glass-card">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-5 w-20 mb-2" />
                                    <Skeleton className="h-6 w-3/4 mb-1" />
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

                {/* Challenges by Category */}
                {!isLoading && !error && Object.keys(challengesByCategory).length > 0 && (
                    <div className="space-y-10">
                        {Object.entries(challengesByCategory).map(([category, categoryChallenges]) => (
                            <div key={category}>
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-xl font-semibold">
                                        {categoryLabels[category] || category}
                                    </h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {categoryChallenges.filter(c => c.isCompleted).length} / {categoryChallenges.length}
                                    </Badge>
                                </div>

                                {/* Challenges Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryChallenges.map((challenge, index) => {
                                        const config = typeConfig[challenge.type] || typeConfig.JAVASCRIPT;
                                        return (
                                            <Link
                                                key={challenge.slug}
                                                to="/challenges/$slug"
                                                params={{ slug: challenge.slug }}
                                                className="group"
                                            >
                                                <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 ${challenge.isCompleted
                                                    ? 'border-green-500/30 bg-green-500/5'
                                                    : 'glass-card hover:border-primary/50'
                                                    }`}>
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono text-muted-foreground">
                                                                    #{index + 1}
                                                                </span>
                                                                <Badge className={config.color} variant="outline">
                                                                    {config.icon}
                                                                    <span className="ml-1">{config.label}</span>
                                                                </Badge>
                                                            </div>
                                                            {challenge.isCompleted && (
                                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                                            )}
                                                        </div>
                                                        <CardTitle className="text-base mt-2 group-hover:text-primary transition-colors line-clamp-1">
                                                            {challenge.title}
                                                        </CardTitle>
                                                        <CardDescription className="line-clamp-2 text-sm">
                                                            {challenge.description}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <Badge
                                                                variant="secondary"
                                                                className={difficultyColors[challenge.difficulty] || ''}
                                                            >
                                                                {challenge.difficulty}
                                                            </Badge>
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                                                    <Trophy className="h-3 w-3" />
                                                                    {challenge.completionCount}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-amber-500 font-medium">
                                                                    <Zap className="h-3 w-3" />
                                                                    {challenge.xpReward} XP
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
