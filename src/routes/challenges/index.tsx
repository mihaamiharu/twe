import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Code, Trophy, Zap, AlertCircle, CheckCircle2, Palette, Route as RouteIcon, LayoutGrid, List, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/useDebounce';
import { ChallengeTierProgress } from '@/components/challenges/ChallengeTierProgress';
import {
    tierLabels,
    categoryLabels,
    difficultyColors,
    getTierFromCategory,
    TIER_ORDER
} from '@/lib/constants';

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

export interface Challenge {
    id: string;
    slug: string;
    title: string;
    description: string;
    type: string;
    difficulty: string;
    category?: string;
    xpReward: number;
    order: number;
    completionCount: number;
    isCompleted?: boolean;
    tags?: string[];
}

export interface ChallengesResponse {
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
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const { data, isLoading, error } = useQuery<ChallengesResponse>({
        queryKey: ['challenges'],
        queryFn: async () => {
            const res = await fetch('/api/challenges?limit=100');
            if (!res.ok) throw new Error('Failed to fetch challenges');
            return res.json();
        },
    });

    const challenges = data?.data ?? [];

    // Filter challenges by search query, type, difficulty, and tier
    const filteredChallenges = useMemo(() => {
        return challenges.filter((c: Challenge) => {
            // Text search on title and description
            if (debouncedSearchQuery) {
                const query = debouncedSearchQuery.toLowerCase();
                const matchesTitle = c.title.toLowerCase().includes(query);
                const matchesDescription = c.description.toLowerCase().includes(query);
                const matchesTags = c.tags?.some(tag => tag.toLowerCase().includes(query));
                if (!matchesTitle && !matchesDescription && !matchesTags) return false;
            }
            if (filterType !== 'all' && c.type !== filterType) return false;
            if (filterDifficulty !== 'all' && c.difficulty !== filterDifficulty) return false;
            if (filterTier !== 'all' && getTierFromCategory(c.category) !== filterTier) return false;
            return true;
        });
    }, [challenges, debouncedSearchQuery, filterType, filterDifficulty, filterTier]);

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

    // Calculate tier progress
    const tierProgress = useMemo(() => {
        const tiers: Record<string, { completed: number; total: number }> = {
            basic: { completed: 0, total: 0 },
            beginner: { completed: 0, total: 0 },
            intermediate: { completed: 0, total: 0 },
            expert: { completed: 0, total: 0 },
        };

        challenges.forEach(c => {
            const tier = getTierFromCategory(c.category);
            if (tiers[tier]) {
                tiers[tier].total++;
                if (c.isCompleted) {
                    tiers[tier].completed++;
                }
            }
        });

        return TIER_ORDER.map(tier => ({
            tier,
            name: tierLabels[tier].name,
            color: tierLabels[tier].color,
            completed: tiers[tier].completed,
            total: tiers[tier].total,
        }));
    }, [challenges]);

    // Sort categories pedagogically
    const sortedChallengesByCategory = useMemo(() => {
        return Object.entries(challengesByCategory).sort(([catA], [catB]) => {
            const tierA = getTierFromCategory(catA);
            const tierB = getTierFromCategory(catB);
            const tierOrderA = TIER_ORDER.indexOf(tierA);
            const tierOrderB = TIER_ORDER.indexOf(tierB);

            if (tierOrderA !== tierOrderB) {
                return tierOrderA - tierOrderB;
            }
            return catA.localeCompare(catB);
        });
    }, [challengesByCategory]);

    // State for view mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

                {/* Search Input */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search challenges by title, description, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card border-border"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Progress Group */}
                <div className="space-y-6 mb-8">
                    {totalChallenges > 0 && (
                        <div className="p-4 rounded-lg bg-card border border-border">
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

                    <ChallengeTierProgress progress={tierProgress} />
                </div>

                {/* Filters and View Toggle */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex items-start justify-between">
                        {/* Type Filter */}
                        <div className="flex flex-wrap gap-2 flex-1">
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

                        {/* View Toggle */}
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border shrink-0 ml-4">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-8 w-8 p-0"
                                title="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-8 w-8 p-0"
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
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
                            const count = challenges.filter((c: Challenge) => c.difficulty === diff).length;
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
                            const count = challenges.filter((c: Challenge) => getTierFromCategory(c.category) === tier).length;
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

                {/* Challenges Content */}
                {!isLoading && !error && sortedChallengesByCategory.length > 0 && (
                    <div className="space-y-10">
                        {sortedChallengesByCategory.map(([category, categoryChallenges]) => (
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

                                {viewMode === 'grid' ? (
                                    /* Grid View */
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
                                ) : (
                                    /* List View */
                                    <div className="rounded-md border bg-card">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">#</TableHead>
                                                    <TableHead className="w-[300px]">Challenge</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Difficulty</TableHead>
                                                    <TableHead className="text-right">Stats</TableHead>
                                                    <TableHead className="w-[100px] text-right">XP</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {categoryChallenges.map((challenge, index) => {
                                                    const config = typeConfig[challenge.type] || typeConfig.JAVASCRIPT;
                                                    return (
                                                        <TableRow key={challenge.slug} className={`group cursor-pointer ${challenge.isCompleted ? 'bg-green-500/5' : ''}`}>
                                                            <TableCell className="font-mono text-muted-foreground">
                                                                <Link to="/challenges/$slug" params={{ slug: challenge.slug }} className="block h-full w-full flex items-center gap-2">
                                                                    #{index + 1}
                                                                    {challenge.isCompleted && (
                                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                    )}
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell className="font-medium group-hover:text-primary transition-colors">
                                                                <Link to="/challenges/$slug" params={{ slug: challenge.slug }} className="block">
                                                                    <div className="font-bold">{challenge.title}</div>
                                                                    <div className="text-xs text-muted-foreground line-clamp-1">{challenge.description}</div>
                                                                </Link>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`${config.color} whitespace-nowrap`} variant="outline">
                                                                    {config.icon}
                                                                    <span className="ml-1">{config.label}</span>
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={difficultyColors[challenge.difficulty] || ''}
                                                                >
                                                                    {challenge.difficulty}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
                                                                    <Trophy className="h-3 w-3" />
                                                                    {challenge.completionCount} completed
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <span className="flex items-center justify-end gap-1 text-amber-500 font-medium">
                                                                    <Zap className="h-3 w-3" />
                                                                    {challenge.xpReward}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
