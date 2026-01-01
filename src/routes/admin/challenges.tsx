import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminChallenges, updateChallengeStatus } from '@/lib/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Layout, Eye, EyeOff, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

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
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link to="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Challenge Manager</h1>
                    <p className="text-muted-foreground mt-1">Control visibility and upcoming content.</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search challenges by title or slug..."
                    className="pl-10 max-w-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                            {filteredChallenges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        {searchQuery ? `No challenges matching "${searchQuery}"` : "No challenges found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredChallenges.map((challenge: AdminChallenge) => {
                                    const isComingSoon = challenge.tags?.includes('coming-soon');
                                    return (
                                        <TableRow key={challenge.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{challenge.title}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{challenge.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {challenge.type.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                                    {challenge.difficulty}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {challenge.isPublished ? <Eye className="h-3 w-3 text-green-600" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                                    <Switch
                                                        checked={challenge.isPublished}
                                                        onCheckedChange={(checked) => updateMutation.mutate({ id: challenge.id, isPublished: checked })}
                                                        disabled={updateMutation.isPending}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                        checked={isComingSoon}
                                                        onCheckedChange={(checked) => updateMutation.mutate({ id: challenge.id, isComingSoon: checked })}
                                                        disabled={updateMutation.isPending}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-400">
                    <Layout className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold text-xs uppercase tracking-wider opacity-70">Visibility</p>
                        <p className="mt-1">
                            Unpublishing a challenge hides it from the list & prevents access to the playground.
                        </p>
                    </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex gap-3 text-sm text-orange-700 dark:text-orange-400">
                    <Clock className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold text-xs uppercase tracking-wider opacity-70">Teasing</p>
                        <p className="mt-1">
                            Marking as "Coming Soon" shows a lock icon and blocks access, but keeps the title visible.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
