import { createFileRoute } from '@tanstack/react-router';
import { Leaderboard, type LeaderboardUser } from '@/components/gamification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar } from 'lucide-react';

export const Route = createFileRoute('/leaderboard')({
    component: LeaderboardPage,
});

// Mock leaderboard data - will be replaced with database queries
const mockUsers: LeaderboardUser[] = [
    {
        id: '1',
        rank: 1,
        previousRank: 2,
        username: 'testmaster',
        displayName: 'Test Master',
        level: 25,
        totalXP: 62500,
        challengesCompleted: 87,
    },
    {
        id: '2',
        rank: 2,
        previousRank: 1,
        username: 'selectorqueen',
        displayName: 'Selector Queen',
        level: 22,
        totalXP: 48400,
        challengesCompleted: 72,
    },
    {
        id: '3',
        rank: 3,
        previousRank: 3,
        username: 'playwrightpro',
        displayName: 'Playwright Pro',
        level: 20,
        totalXP: 40000,
        challengesCompleted: 65,
    },
    {
        id: '4',
        rank: 4,
        previousRank: 5,
        username: 'xpathxpert',
        displayName: 'XPath Expert',
        level: 18,
        totalXP: 32400,
        challengesCompleted: 58,
    },
    {
        id: '5',
        rank: 5,
        previousRank: 4,
        username: 'codeninja',
        displayName: 'Code Ninja',
        level: 17,
        totalXP: 28900,
        challengesCompleted: 51,
    },
    {
        id: '6',
        rank: 6,
        username: 'qawarrior',
        displayName: 'QA Warrior',
        level: 15,
        totalXP: 22500,
        challengesCompleted: 45,
    },
    {
        id: '7',
        rank: 7,
        username: 'bugbuster',
        displayName: 'Bug Buster',
        level: 14,
        totalXP: 19600,
        challengesCompleted: 42,
    },
    {
        id: '8',
        rank: 8,
        username: 'testrunner',
        displayName: 'Test Runner',
        level: 12,
        totalXP: 14400,
        challengesCompleted: 35,
    },
    {
        id: '9',
        rank: 9,
        username: 'elementfinder',
        displayName: 'Element Finder',
        level: 10,
        totalXP: 10000,
        challengesCompleted: 28,
    },
    {
        id: '10',
        rank: 10,
        username: 'webinspector',
        displayName: 'Web Inspector',
        level: 8,
        totalXP: 6400,
        challengesCompleted: 22,
    },
];

// Mock monthly leaderboard (different rankings)
const mockMonthlyUsers: LeaderboardUser[] = [
    {
        id: '5',
        rank: 1,
        username: 'codeninja',
        displayName: 'Code Ninja',
        level: 17,
        totalXP: 4500,
        challengesCompleted: 18,
    },
    {
        id: '3',
        rank: 2,
        username: 'playwrightpro',
        displayName: 'Playwright Pro',
        level: 20,
        totalXP: 3800,
        challengesCompleted: 15,
    },
    {
        id: '1',
        rank: 3,
        username: 'testmaster',
        displayName: 'Test Master',
        level: 25,
        totalXP: 3200,
        challengesCompleted: 12,
    },
    {
        id: '7',
        rank: 4,
        username: 'bugbuster',
        displayName: 'Bug Buster',
        level: 14,
        totalXP: 2800,
        challengesCompleted: 11,
    },
    {
        id: '2',
        rank: 5,
        username: 'selectorqueen',
        displayName: 'Selector Queen',
        level: 22,
        totalXP: 2400,
        challengesCompleted: 9,
    },
];

function LeaderboardPage() {
    // Mock current user ID (would come from auth context)
    const currentUserId = '5';

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-3">Leaderboard</h1>
                    <p className="text-muted-foreground text-lg">
                        See how you stack up against other testers
                    </p>
                </div>

                <Tabs defaultValue="all-time" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all-time" className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            All Time
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            This Month
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all-time">
                        <Leaderboard
                            users={mockUsers}
                            currentUserId={currentUserId}
                            title="All-Time Leaderboard"
                            maxDisplay={10}
                        />
                    </TabsContent>

                    <TabsContent value="monthly">
                        <Leaderboard
                            users={mockMonthlyUsers}
                            currentUserId={currentUserId}
                            title="Monthly Leaderboard"
                            maxDisplay={10}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
