import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Star, Trophy, Zap } from 'lucide-react';

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

// Mock data - will be replaced with database queries
const challenges = [
    {
        slug: 'click-the-button',
        title: 'Click the Button',
        description: 'Write a Playwright test to click a button and verify the result',
        type: 'PLAYWRIGHT',
        difficulty: 'Easy',
        xp: 50,
        completedBy: 1234,
    },
    {
        slug: 'find-by-class',
        title: 'Find Elements by Class',
        description: 'Use CSS selectors to find elements with specific classes',
        type: 'CSS_SELECTOR',
        difficulty: 'Easy',
        xp: 75,
        completedBy: 987,
    },
    {
        slug: 'complex-xpath',
        title: 'Complex XPath Navigation',
        description: 'Navigate the DOM using advanced XPath expressions',
        type: 'XPATH_SELECTOR',
        difficulty: 'Hard',
        xp: 200,
        completedBy: 245,
    },
    {
        slug: 'array-manipulation',
        title: 'Array Manipulation',
        description: 'Solve JavaScript array problems with efficient algorithms',
        type: 'JAVASCRIPT',
        difficulty: 'Medium',
        xp: 125,
        completedBy: 567,
    },
];

function ChallengesPage() {
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
                                            <Badge className={typeColors[challenge.type]}>{challenge.type.replace('_', ' ')}</Badge>
                                        </div>
                                        <Badge variant="secondary">{challenge.difficulty}</Badge>
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
                                            {challenge.completedBy.toLocaleString()} solved
                                        </div>
                                        <div className="flex items-center gap-1 text-accent">
                                            <Zap className="h-4 w-4" />
                                            {challenge.xp} XP
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
