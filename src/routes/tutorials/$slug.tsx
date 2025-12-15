import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ArrowLeft, BookOpen, CheckCircle, Circle, Clock, Star } from 'lucide-react';

export const Route = createFileRoute('/tutorials/$slug')({
    component: TutorialDetailPage,
});

// Mock tutorial data with full markdown content
const tutorialData: Record<string, {
    title: string;
    description: string;
    difficulty: string;
    duration: string;
    xp: number;
    sections: { id: string; title: string; completed: boolean }[];
    content: string;
}> = {
    'introduction-to-playwright': {
        title: 'Introduction to Playwright',
        description: 'Learn the basics of browser automation with Playwright',
        difficulty: 'Beginner',
        duration: '30 min',
        xp: 100,
        sections: [
            { id: 'what-is', title: 'What is Playwright?', completed: false },
            { id: 'setup', title: 'Setting Up Your Environment', completed: false },
            { id: 'first-test', title: 'Your First Test', completed: false },
            { id: 'locators', title: 'Locators and Selectors', completed: false },
            { id: 'assertions', title: 'Actions and Assertions', completed: false },
        ],
        content: `# Introduction to Playwright

Playwright is a powerful end-to-end testing framework that enables reliable browser automation across all modern browsers.

## What is Playwright?

Playwright is an open-source automation library developed by Microsoft. It provides a high-level API to control Chromium, Firefox, and WebKit browsers.

### Key Features

- **Cross-browser testing** - Test on Chrome, Firefox, Safari, and Edge
- **Auto-wait** - Playwright waits for elements before performing actions
- **Mobile emulation** - Test responsive designs with device emulation
- **Network interception** - Mock API responses for isolated testing

## Setting Up Your Environment

First, let's install Playwright in your project:

\`\`\`bash
npm init playwright@latest
\`\`\`

This will create the following structure:

\`\`\`
├── playwright.config.ts
├── package.json
├── tests/
│   └── example.spec.ts
└── tests-examples/
\`\`\`

## Your First Test

Here's a simple test that navigates to a page and checks the title:

\`\`\`typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Expect a title to contain a substring
  await expect(page).toHaveTitle(/Example Domain/);
});
\`\`\`

> **Tip:** Playwright automatically waits for elements to be ready before interacting with them!

## Locators and Selectors

Playwright provides several ways to locate elements:

| Method | Example | Description |
|--------|---------|-------------|
| \`getByRole\` | \`page.getByRole('button')\` | Find by ARIA role |
| \`getByText\` | \`page.getByText('Submit')\` | Find by text content |
| \`getByLabel\` | \`page.getByLabel('Email')\` | Find form inputs by label |
| \`locator\` | \`page.locator('.my-class')\` | CSS/XPath selectors |

### Best Practice: Use Role-Based Selectors

\`\`\`typescript
// ✅ Recommended - resilient to changes
await page.getByRole('button', { name: 'Submit' }).click();

// ❌ Avoid - brittle selector
await page.locator('#submit-btn-v2').click();
\`\`\`

## Actions and Assertions

Common actions in Playwright:

\`\`\`typescript
// Click an element
await page.getByRole('button').click();

// Fill input fields
await page.getByLabel('Email').fill('test@example.com');

// Select dropdown option
await page.getByLabel('Country').selectOption('USA');

// Check a checkbox
await page.getByLabel('Agree to terms').check();
\`\`\`

### Assertions

\`\`\`typescript
// Check visibility
await expect(page.getByText('Success')).toBeVisible();

// Check text content
await expect(page.getByRole('heading')).toHaveText('Welcome');

// Check URL
await expect(page).toHaveURL(/dashboard/);
\`\`\`

---

## Next Steps

Now that you understand the basics, try the practice challenges:

1. **Click the Button** - Write a test to click a button
2. **Form Submission** - Fill and submit a form
3. **Navigation Test** - Test page navigation
`,
    },
    'css-selectors-mastery': {
        title: 'CSS Selectors Mastery',
        description: 'Master CSS selectors for reliable element selection',
        difficulty: 'Intermediate',
        duration: '45 min',
        xp: 150,
        sections: [
            { id: 'basics', title: 'Selector Basics', completed: false },
            { id: 'combinators', title: 'Combinators', completed: false },
            { id: 'pseudo', title: 'Pseudo-classes', completed: false },
            { id: 'attributes', title: 'Attribute Selectors', completed: false },
        ],
        content: `# CSS Selectors Mastery

Master the art of selecting DOM elements with CSS selectors.

## Selector Basics

CSS selectors are patterns used to select elements in the DOM.

\`\`\`css
/* Element selector */
button { }

/* Class selector */
.btn { }

/* ID selector */
#submit { }

/* Combining selectors */
button.btn#submit { }
\`\`\`

## Combinators

Combinators allow you to select elements based on relationships.

\`\`\`css
/* Descendant (space) */
.form input { }

/* Child (>) */
.form > input { }

/* Adjacent sibling (+) */
label + input { }

/* General sibling (~) */
h2 ~ p { }
\`\`\`

## Practice

Try these selectors in the challenge playground!
`,
    },
};

function TutorialDetailPage() {
    const { slug } = useParams({ from: '/tutorials/$slug' });
    const [scrollProgress, setScrollProgress] = useState(0);

    const tutorial = tutorialData[slug] || {
        title: 'Tutorial Not Found',
        description: '',
        difficulty: '',
        duration: '',
        xp: 0,
        sections: [],
        content: '# Tutorial Not Found\n\nThe requested tutorial could not be found.',
    };

    // Track scroll progress for reading indicator
    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrollTop = window.scrollY;
            const progress = (scrollTop / documentHeight) * 100;
            setScrollProgress(Math.min(100, Math.max(0, progress)));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const completedCount = tutorial.sections.filter((s) => s.completed).length;
    const sectionProgress = tutorial.sections.length > 0
        ? (completedCount / tutorial.sections.length) * 100
        : 0;

    return (
        <>
            {/* Reading Progress Bar */}
            <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-6xl mx-auto">
                    {/* Back navigation */}
                    <Link
                        to="/tutorials"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tutorials
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="lg:col-span-1 order-2 lg:order-1">
                            <Card className="glass-card sticky top-24">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <Badge variant="secondary">{tutorial.difficulty}</Badge>
                                    </div>
                                    <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {tutorial.duration}
                                        </span>
                                        <span className="flex items-center gap-1 text-accent">
                                            <Star className="h-4 w-4" />
                                            {tutorial.xp} XP
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Section Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{sectionProgress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={sectionProgress} className="h-2" />
                                    </div>

                                    {/* Section List */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium mb-3">Sections</h4>
                                        {tutorial.sections.map((section, index) => (
                                            <a
                                                key={section.id}
                                                href={`#${section.id}`}
                                                className="flex items-center gap-2 text-sm py-1 hover:text-primary transition-colors"
                                            >
                                                {section.completed ? (
                                                    <CheckCircle className="h-4 w-4 text-accent" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span
                                                    className={
                                                        section.completed
                                                            ? 'text-muted-foreground line-through'
                                                            : ''
                                                    }
                                                >
                                                    {index + 1}. {section.title}
                                                </span>
                                            </a>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 space-y-2">
                                        <Button className="w-full">Mark as Complete</Button>
                                        <Button variant="outline" className="w-full">
                                            Start Challenge
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Content */}
                        <div className="lg:col-span-3 order-1 lg:order-2">
                            <Card className="glass-card">
                                <CardContent className="p-6 md:p-10">
                                    <MarkdownRenderer content={tutorial.content} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
