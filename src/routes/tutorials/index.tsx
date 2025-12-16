import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Search, AlertCircle } from 'lucide-react';

export const Route = createFileRoute('/tutorials/')({
    component: TutorialsPage,
});

interface Tutorial {
    id: string;
    slug: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    tags?: string[];
    isCompleted?: boolean;
    viewCount: number;
}

interface TutorialsResponse {
    success: boolean;
    data: Tutorial[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function TutorialsPage() {
    const [search, setSearch] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');

    const { data, isLoading, error } = useQuery<TutorialsResponse>({
        queryKey: ['tutorials'],
        queryFn: async () => {
            const res = await fetch('/api/tutorials');
            if (!res.ok) throw new Error('Failed to fetch tutorials');
            return res.json();
        },
    });

    const tutorials = data?.data ?? [];

    // Filter tutorials based on search
    const filteredTutorials = useMemo(() => {
        return tutorials.filter((tutorial) => {
            const matchesSearch =
                tutorial.title.toLowerCase().includes(search.toLowerCase()) ||
                tutorial.description.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [tutorials, search]);

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Tutorials</h1>
                    <p className="text-muted-foreground text-lg">
                        Learn QA testing concepts with step-by-step guides
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tutorials..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {difficulties.map((difficulty) => (
                            <Badge
                                key={difficulty}
                                variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => setSelectedDifficulty(difficulty)}
                            >
                                {difficulty}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
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
                        <h3 className="text-lg font-semibold mb-2">Failed to load tutorials</h3>
                        <p className="text-muted-foreground">Please try again later</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredTutorials.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tutorials found</h3>
                        <p className="text-muted-foreground">
                            {search ? 'Try a different search term' : 'Check back soon for new tutorials!'}
                        </p>
                    </div>
                )}

                {/* Tutorials Grid */}
                {!isLoading && !error && filteredTutorials.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTutorials.map((tutorial) => (
                            <Link
                                key={tutorial.slug}
                                to="/tutorials/$slug"
                                params={{ slug: tutorial.slug }}
                                className="group"
                            >
                                <Card className="h-full glass-card hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                                    <CardHeader>
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            {tutorial.tags && tutorial.tags.length > 0 && (
                                                <Badge variant="secondary">{tutorial.tags[0]}</Badge>
                                            )}
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors">
                                            {tutorial.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {tutorial.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {tutorial.estimatedMinutes} min
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
