import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTutorials } from '@/lib/tutorials.fn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Clock, Search, AlertCircle, CheckCircle2, LayoutGrid, List, Layers } from 'lucide-react';

export const Route = createFileRoute('/tutorials/')({
    component: TutorialsPage,
    head: () => ({
        meta: [
            {
                title: 'Testing Tutorials | TestingWithEkki',
            },
            {
                name: 'description',
                content: 'Step-by-step guides for mastering software testing. Learn Playwright, end-to-end testing strategies, and best practices.',
            }
        ]
    })
});

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function TutorialsPage() {
    const [search, setSearch] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data: tutorialsResponse, isLoading, error } = useQuery({
        queryKey: ['tutorials', search],
        queryFn: async () => {
            const result = await getTutorials({
                data: {
                    search: search || undefined,
                    limit: 50,
                }
            });
            if (!result.success) throw new Error(result.error);
            return result;
        },
    });

    const tutorials = tutorialsResponse?.data ?? [];

    // Group tutorials for the "All" view (Track view)
    const groupedTutorials = useMemo(() => {
        if (selectedDifficulty !== 'All') return null;

        const groups: Record<string, typeof tutorials> = {
            'Beginner': [],
            'Intermediate': [],
            'Advanced': [],
            'Other': []
        };

        tutorials.forEach(t => {
            const tag = t.tags?.find(tag => ['beginner', 'intermediate', 'advanced'].includes(tag.toLowerCase()));
            if (tag) {
                const key = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
                if (groups[key]) groups[key].push(t);
                else groups['Other'].push(t);
            } else {
                groups['Other'].push(t);
            }
        });

        return groups;
    }, [tutorials, selectedDifficulty]);

    const filteredTutorials = useMemo(() => {
        if (selectedDifficulty === 'All') return tutorials;
        return tutorials.filter(t => t.tags?.some(tag => tag.toLowerCase() === selectedDifficulty.toLowerCase()));
    }, [tutorials, selectedDifficulty]);

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Tutorials</h1>
                    <p className="text-muted-foreground text-lg">
                        Walk through core concepts with me, step-by-step.
                    </p>
                </div>

                {/* Search, Filters, and View Toggle */}
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tutorials..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto bg-muted/50 p-1 rounded-lg border border-border">
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

                    <div className="flex flex-wrap gap-2">
                        {difficulties.map((difficulty) => (
                            <Badge
                                key={difficulty}
                                variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                                className="cursor-pointer px-3 py-1 text-sm"
                                onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? 'All' : difficulty)}
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

                {/* Tutorials Content */}
                {!isLoading && !error && filteredTutorials.length > 0 && (
                    <>
                        {/* Track View (Grouped) - Only in Grid Mode and when 'All' is selected */}
                        {viewMode === 'grid' && groupedTutorials ? (
                            <div className="space-y-12">
                                {(['Beginner', 'Intermediate', 'Advanced', 'Other'] as const).map((level) => {
                                    const items = groupedTutorials[level];
                                    if (!items || items.length === 0) return null;

                                    return (
                                        <div key={level} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-brand-teal/20 flex items-center justify-center border border-brand-teal/30">
                                                    <Layers className="h-4 w-4 text-brand-teal-dark" />
                                                </div>
                                                <h2 className="text-2xl font-bold tracking-tight">{level === 'Other' ? 'Additional Tutorials' : `${level} Track`}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-4 border-l-2 border-border/50 ml-4">
                                                {items.map((tutorial) => (
                                                    <TutorialCard key={tutorial.slug} tutorial={tutorial} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Filtered Grid or List View */
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTutorials.map((tutorial) => (
                                        <TutorialCard key={tutorial.slug} tutorial={tutorial} />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-md border bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="w-[300px]">Title</TableHead>
                                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                                <TableHead>Tags</TableHead>
                                                <TableHead className="text-right">Time</TableHead>
                                                <TableHead className="w-[100px] text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTutorials.map((tutorial) => (
                                                <TableRow key={tutorial.slug} className="group cursor-pointer">
                                                    <TableCell>
                                                        <Link to="/tutorials/$slug" params={{ slug: tutorial.slug }} className="block h-full w-full flex items-center justify-center text-muted-foreground group-hover:text-primary">
                                                            <BookOpen className="h-4 w-4" />
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="font-medium group-hover:text-primary transition-colors">
                                                        <Link to="/tutorials/$slug" params={{ slug: tutorial.slug }} className="block">
                                                            {tutorial.title}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                                                        {tutorial.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {tutorial.tags?.slice(0, 2).map(tag => (
                                                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0 border-border/50">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {tutorial.estimatedMinutes}m
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end">
                                                            {tutorial.isCompleted && (
                                                                <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 gap-1 pr-2">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    Done
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TutorialCard({ tutorial }: { tutorial: any }) {
    return (
        <Link
            to="/tutorials/$slug"
            params={{ slug: tutorial.slug }}
            className="group"
        >
            <Card className="h-full glass-card hover:border-brand-teal/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand-teal/5 relative overflow-hidden border border-border">
                {/* Completed Badge */}
                {tutorial.isCompleted && (
                    <div className="absolute top-0 right-0 p-2 bg-green-500/10 rounded-bl-lg border-l border-b border-green-500/20 z-10">
                        <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Done
                        </div>
                    </div>
                )}
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-brand-teal" />
                        {tutorial.tags && tutorial.tags.length > 0 && (
                            <Badge variant="secondary" className="border-transparent bg-secondary/50 text-secondary-foreground">{tutorial.tags[0]}</Badge>
                        )}
                    </div>
                    <CardTitle className="group-hover:text-brand-teal transition-colors text-lg">
                        {tutorial.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                        {/* {tutorial.description} */} {/* Description commented out in original code? No, keeping it. */}
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
    );
}

export default TutorialsPage;
