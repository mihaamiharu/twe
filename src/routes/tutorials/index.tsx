import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Star } from 'lucide-react';

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
    },
    {
        slug: 'css-selectors-mastery',
        title: 'CSS Selectors Mastery',
        description: 'Master CSS selectors for reliable element selection',
        duration: '45 min',
        difficulty: 'Intermediate',
        xp: 150,
    },
    {
        slug: 'xpath-fundamentals',
        title: 'XPath Fundamentals',
        description: 'Deep dive into XPath for complex element queries',
        duration: '60 min',
        difficulty: 'Advanced',
        xp: 200,
    },
];

function TutorialsPage() {
    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Tutorials</h1>
                    <p className="text-muted-foreground text-lg">
                        Learn testing concepts step by step with interactive tutorials
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutorials.map((tutorial) => (
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
                                        <Badge variant="secondary">{tutorial.difficulty}</Badge>
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
            </div>
        </div>
    );
}
