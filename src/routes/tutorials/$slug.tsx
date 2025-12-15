import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, CheckCircle, Circle } from 'lucide-react';

export const Route = createFileRoute('/tutorials/$slug')({
    component: TutorialDetailPage,
});

// Mock data - will be replaced with database queries
const tutorialData: Record<string, {
    title: string;
    description: string;
    difficulty: string;
    sections: { title: string; completed: boolean }[];
    content: string;
}> = {
    'introduction-to-playwright': {
        title: 'Introduction to Playwright',
        description: 'Learn the basics of browser automation with Playwright',
        difficulty: 'Beginner',
        sections: [
            { title: 'What is Playwright?', completed: false },
            { title: 'Setting Up Your Environment', completed: false },
            { title: 'Your First Test', completed: false },
            { title: 'Locators and Selectors', completed: false },
            { title: 'Actions and Assertions', completed: false },
        ],
        content: `
# Introduction to Playwright

Playwright is a powerful end-to-end testing framework that enables reliable browser automation.

## What You'll Learn

- How to set up Playwright in your project
- Writing your first browser test
- Understanding selectors and locators
- Making assertions about page content

## Prerequisites

- Basic JavaScript/TypeScript knowledge
- Node.js installed on your machine
- A code editor (VS Code recommended)

Let's get started!
    `,
    },
};

function TutorialDetailPage() {
    const { slug } = useParams({ from: '/tutorials/$slug' });
    const tutorial = tutorialData[slug] || {
        title: 'Tutorial Not Found',
        description: '',
        difficulty: '',
        sections: [],
        content: 'The requested tutorial could not be found.',
    };

    const completedCount = tutorial.sections.filter((s) => s.completed).length;
    const progress = tutorial.sections.length > 0
        ? (completedCount / tutorial.sections.length) * 100
        : 0;

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Back navigation */}
                <Link to="/tutorials" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tutorials
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="glass-card sticky top-6">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <Badge variant="secondary">{tutorial.difficulty}</Badge>
                                </div>
                                <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="space-y-2">
                                    {tutorial.sections.map((section, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            {section.completed ? (
                                                <CheckCircle className="h-4 w-4 text-accent" />
                                            ) : (
                                                <Circle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className={section.completed ? 'text-muted-foreground line-through' : ''}>
                                                {section.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <Card className="glass-card">
                            <CardContent className="p-8 prose prose-invert max-w-none">
                                <h1 className="gradient-text">{tutorial.title}</h1>
                                <p className="text-muted-foreground text-lg">{tutorial.description}</p>

                                <div className="whitespace-pre-wrap mt-8">
                                    {tutorial.content}
                                </div>

                                <div className="flex gap-4 mt-10">
                                    <Button size="lg">Start Tutorial</Button>
                                    <Button size="lg" variant="outline">Mark as Complete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
