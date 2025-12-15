import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Play, RotateCcw, Send, Zap } from 'lucide-react';

export const Route = createFileRoute('/challenges/$slug')({
    component: ChallengePlaygroundPage,
});

// Mock data
const challengeData: Record<string, {
    title: string;
    description: string;
    type: string;
    difficulty: string;
    xp: number;
    instructions: string;
    starterCode: string;
    testCases: { input: string; expected: string }[];
}> = {
    'click-the-button': {
        title: 'Click the Button',
        description: 'Write a Playwright test to click a button and verify the result',
        type: 'PLAYWRIGHT',
        difficulty: 'Easy',
        xp: 50,
        instructions: `
## Objective

Write a Playwright test that:
1. Navigates to the target page
2. Clicks the "Submit" button
3. Verifies that a success message appears

## Hints

- Use \`page.locator()\` to find elements
- Use \`locator.click()\` to click elements
- Use \`expect()\` to make assertions
    `,
        starterCode: `import { test, expect } from '@playwright/test';

test('should click button and show success', async ({ page }) => {
  // Navigate to the page
  await page.goto('/challenge/click-the-button');

  // TODO: Click the submit button
  
  // TODO: Verify success message appears
});`,
        testCases: [
            { input: 'Click submit button', expected: 'Success message visible' },
            { input: 'No action', expected: 'No success message' },
        ],
    },
};

function ChallengePlaygroundPage() {
    const { slug } = useParams({ from: '/challenges/$slug' });
    const challenge = challengeData[slug] || {
        title: 'Challenge Not Found',
        description: '',
        type: 'UNKNOWN',
        difficulty: '',
        xp: 0,
        instructions: 'The requested challenge could not be found.',
        starterCode: '// Challenge not found',
        testCases: [],
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/challenges" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="font-semibold">{challenge.title}</h1>
                        <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">{challenge.difficulty}</Badge>
                            <span className="text-accent flex items-center gap-1">
                                <Zap className="h-3 w-3" /> {challenge.xp} XP
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Run Tests
                    </Button>
                    <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Submit
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-x divide-border">
                {/* Left panel - Instructions */}
                <div className="p-6 overflow-auto">
                    <Tabs defaultValue="instructions">
                        <TabsList>
                            <TabsTrigger value="instructions">Instructions</TabsTrigger>
                            <TabsTrigger value="testcases">Test Cases</TabsTrigger>
                        </TabsList>
                        <TabsContent value="instructions" className="mt-4">
                            <Card className="glass-card">
                                <CardContent className="p-6 prose prose-invert max-w-none">
                                    <h2>{challenge.title}</h2>
                                    <p className="text-muted-foreground">{challenge.description}</p>
                                    <div className="whitespace-pre-wrap">{challenge.instructions}</div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="testcases" className="mt-4 space-y-4">
                            {challenge.testCases.map((tc, index) => (
                                <Card key={index} className="glass-card">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-sm">Test Case {index + 1}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-3 space-y-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Input: </span>
                                            <code className="text-primary">{tc.input}</code>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Expected: </span>
                                            <code className="text-accent">{tc.expected}</code>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right panel - Code Editor */}
                <div className="p-6 bg-background">
                    <Card className="h-full glass-card">
                        <CardHeader className="py-3 border-b border-border">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Code Editor</CardTitle>
                                <Badge variant="outline">{challenge.type}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Code editor placeholder - will be Monaco editor later */}
                            <div className="font-mono text-sm p-4 bg-muted/30 min-h-[400px] whitespace-pre overflow-auto">
                                {challenge.starterCode}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
