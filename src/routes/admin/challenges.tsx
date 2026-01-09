import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminChallenges, updateChallengeStatus } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Layout, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminChallenge {
    id: string;
    title: string;
    slug: string;
    type: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    xpReward: number;
    order: number;
    isPublished: boolean;
    tags: string[] | null;
}

export const Route = createFileRoute('/admin/challenges')({
    loader: ({ context }) => {
        const session = context.auth;
        if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
            throw redirect({
                to: '/',
            });
        }
    },
    component: ChallengeManager,
});

function ChallengeManager() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: challenges, isLoading } = useQuery({
        queryKey: ['admin-challenges'],
        queryFn: async () => {
            const res = await getAdminChallenges();
            if (!res.success) throw new Error(res.error || 'Failed to fetch challenges');
            return res.data;
        },
    });

    const filteredChallenges = useMemo(() => {
        if (!challenges) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return challenges;
        return challenges.filter((c: AdminChallenge) =>
            c.title?.toLowerCase().includes(query) ||
            c.slug?.toLowerCase().includes(query)
        );
    }, [challenges, searchQuery]);

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; isPublished?: boolean; isComingSoon?: boolean }) => {
            const res = await updateChallengeStatus({ data });
            if (!res.success) throw new Error(res.error || 'Failed to update challenge');
            return res;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
            toast.success('Challenge updated successfully');
        },
        onError: () => {
            toast.error('Failed to update challenge');
        },
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading challenges...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in relative z-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-6">
                <div className="flex items-center gap-4">
                    <Link to="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Challenge Manager
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Control visibility and upcoming content.
                        </p>
                    </div>
                </div>

                <div className="relative group w-full md:w-auto">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-lg blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search challenges..."
                            className="pl-10 w-full md:w-[300px] bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Challenge</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Difficulty</TableHead>
                                <TableHead className="text-center">Published</TableHead>
                                <TableHead className="text-center">Coming Soon</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredChallenges.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            {searchQuery ? `No challenges matching "${searchQuery}"` : "No challenges found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredChallenges.map((challenge: AdminChallenge) => {
                                        const isComingSoon = challenge.tags?.includes('coming-soon');

                                        // Badge Colors
                                        const typeColors = {
                                            JAVASCRIPT: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
                                            PLAYWRIGHT: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
                                            CSS_SELECTOR: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                                            XPATH_SELECTOR: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
                                        };

                                        const difficultyColors = {
                                            EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                                            MEDIUM: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
                                            HARD: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
                                        };

                                        return (
                                            <motion.tr
                                                key={challenge.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                            >
                                                <TableCell component="th"> {/* Workaround for motion.tr typings if needed, but usually motion.tr works fine as child of tbody if TableBody accepts valid nodes? Actually radix/shadcn TableBody is basically a tbody. Framer motion needs direct direct parent context sometimes or replace TableRow with motion copy of it. */}
                                                    {/* Ideally I should use a custom component for motion row or just motion.tr inside standard tbody. 
                                                       However, shadcn TableRow is a component. I should make it a motion component.
                                                       Or better: wrap the content of TableRow? No, animation needs to be on the row.
                                                       Let's try using standard motion.tr but keeping ShadCN classes on it.
                                                     */}
                                                    <div className="flex flex-col py-2">
                                                        <span className="font-medium text-sm group-hover:text-primary transition-colors">{challenge.title}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{challenge.slug}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-[10px] uppercase shadow-sm ${typeColors[challenge.type] || ""}`}>
                                                        {challenge.type.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className={`text-[10px] shadow-sm ${difficultyColors[challenge.difficulty] || ""}`}>
                                                        {challenge.difficulty}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Switch
                                                            checked={challenge.isPublished}
                                                            onCheckedChange={(checked) => updateMutation.mutate({ id: challenge.id, isPublished: checked })}
                                                            disabled={updateMutation.isPending}
                                                            className="data-[state=checked]:bg-green-600"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Switch
                                                            checked={isComingSoon}
                                                            onCheckedChange={(checked) => updateMutation.mutate({ id: challenge.id, isComingSoon: checked })}
                                                            disabled={updateMutation.isPending}
                                                            className="data-[state=checked]:bg-orange-500"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-500/5 border-blue-200/20 shadow-none dark:bg-blue-500/10">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                            <Layout className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">Visibility</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Unpublishing a challenge hides it from the list & prevents access to the playground.
                                Changes reflect immediately.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-500/5 border-orange-200/20 shadow-none dark:bg-orange-500/10">
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-orange-700 dark:text-orange-300 mb-1">Teasing</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Marking as "Coming Soon" shows a lock icon and blocks access, but keeps the title visible.
                                Useful for roadmap items.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
