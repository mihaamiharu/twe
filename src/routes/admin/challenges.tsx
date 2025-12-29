import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Clock, Layout, Zap, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export const Route = createFileRoute('/admin/challenges')({
    component: ChallengeManager,
});

function ChallengeManager() {
    const queryClient = useQueryClient();

    const { data: challenges, isLoading } = useQuery({
        queryKey: ['admin-challenges'],
        queryFn: async () => {
            const res = await fetch('/api/admin/challenges');
            if (!res.ok) throw new Error('Failed to fetch challenges');
            const json = await res.json();
            return json.data;
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; isPublished?: boolean; isComingSoon?: boolean }) => {
            const res = await fetch('/api/admin/challenges', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update challenge');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
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
                            {challenges?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No challenges found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                challenges?.map((challenge: any) => {
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
