import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, Search, Star } from 'lucide-react';

export const Route = createFileRoute('/tutorials/')({
    component: TutorialsPage,
});

// Mock data - will be replaced with database queries
const tutorials = [
    {
        slug: 'introduction-to-playwright',
        title: 'Introduction to Playwright',
        description: 'Learn the basics of browser automation with Playwright',
        duration: '30 min',
        difficulty: 'Beginner',
        xp: 100,
        category: 'Playwright',
    },
    {
        slug: 'css-selectors-mastery',
        title: 'CSS Selectors Mastery',
        description: 'Master CSS selectors for reliable element selection',
        duration: '45 min',
        difficulty: 'Intermediate',
        xp: 150,
        category: 'Selectors',
    },
    {
        slug: 'xpath-fundamentals',
        title: 'XPath Fundamentals',
        description: 'Deep dive into XPath for complex element queries',
        duration: '60 min',
        difficulty: 'Advanced',
        xp: 200,
        category: 'Selectors',
    },
    {
        slug: 'writing-maintainable-tests',
        title: 'Writing Maintainable Tests',
        description: 'Best practices for creating tests that scale',
        duration: '40 min',
        difficulty: 'Intermediate',
        xp: 175,
        category: 'Best Practices',
    },
    {
        slug: 'page-object-model',
        title: 'Page Object Model',
        description: 'Structure your tests with the POM pattern',
        duration: '35 min',
        difficulty: 'Intermediate',
        xp: 150,
        category: 'Patterns',
    },
    {
        slug: 'debugging-failed-tests',
        title: 'Debugging Failed Tests',
        description: 'Learn techniques to quickly find and fix test failures',
        duration: '25 min',
        difficulty: 'Beginner',
        xp: 100,
        category: 'Debugging',
    },
];

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const categories = ['All', ...new Set(tutorials.map((t) => t.category))];

function TutorialsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredTutorials = useMemo(() => {
        return tutorials.filter((tutorial) => {
            const matchesSearch =
                tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDifficulty =
                selectedDifficulty === 'All' || tutorial.difficulty === selectedDifficulty;
            const matchesCategory =
                selectedCategory === 'All' || tutorial.category === selectedCategory;

            return matchesSearch && matchesDifficulty && matchesCategory;
        });
    }, [searchQuery, selectedDifficulty, selectedCategory]);

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Tutorials</h1>
                    <p className="text-muted-foreground text-lg">
                        Learn testing concepts step by step with interactive tutorials
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 space-y-4">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search tutorials..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        {/* Difficulty Filter */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground self-center mr-2">
                                Difficulty:
                            </span>
                            {difficulties.map((difficulty) => (
                                <Badge
                                    key={difficulty}
                                    variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/20"
                                    onClick={() => setSelectedDifficulty(difficulty)}
                                >
                                    {difficulty}
                                </Badge>
                            ))}
                        </div>

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground self-center mr-2">
                                Category:
                            </span>
                            {categories.map((category) => (
                                <Badge
                                    key={category}
                                    variant={selectedCategory === category ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/20"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-muted-foreground mb-6">
                    Showing {filteredTutorials.length} of {tutorials.length} tutorials
                </p>

                {/* Tutorial Grid */}
                {filteredTutorials.length > 0 ? (
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
                                        <div className="flex items-start justify-between">
                                            <BookOpen className="h-8 w-8 text-primary" />
                                            <div className="flex gap-2">
                                                <Badge variant="outline">{tutorial.category}</Badge>
                                                <Badge variant="secondary">{tutorial.difficulty}</Badge>
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                                            {tutorial.title}
                                        </CardTitle>
                                        <CardDescription>{tutorial.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {tutorial.duration}
                                            </div>
                                            <div className="flex items-center gap-1 text-accent">
                                                <Star className="h-4 w-4" />
                                                {tutorial.xp} XP
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No tutorials found matching your criteria.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
