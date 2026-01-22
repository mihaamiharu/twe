import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAdminUserDetail } from '@/server/admin.fn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Mail,
    Calendar,
    Shield,
    Trophy,
    History,
    User as UserIcon,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/admin/users/$userId')({
    component: UserDetailPage,
});

function UserDetailPage() {
    const { userId } = Route.useParams();

    const { data: user, isLoading } = useQuery({
        queryKey: ['admin-user', userId],
        queryFn: async () => {
            const res = await getAdminUserDetail({ data: { userId } });
            if (!res.success) throw new Error(res.error || 'Failed to fetch user');
            return res.data;
        },
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading user profile...</div>;
    if (!user) return <div className="p-8 text-center">User not found</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in text-card-foreground">
            <div className="flex items-center gap-4">
                <Link to="/admin/users">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4 border-4 border-background shadow-xl">
                            {user.image ? (
                                <img src={user.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon className="h-12 w-12 text-primary" />
                            )}
                        </div>
                        <CardTitle>{user.name || 'Anonymous User'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                {user.role}
                            </Badge>
                            {!user.showOnLeaderboard && (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
                                    Shadow Banned
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 border-t mt-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span>ID: <code className="text-[10px] bg-muted px-1 rounded">{user.id}</code></span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats & Activity */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Total XP</span>
                                    <Trophy className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-2xl font-bold mt-2">{user.xp || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Challenges</span>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold mt-2">{(user as any).progressCount || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Recent Submissions</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Challenge</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.submissions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                No submissions yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        user.submissions?.map((sub) => (
                                            <TableRow key={sub.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {typeof sub.challenge?.title === 'object' ? sub.challenge.title.en : sub.challenge?.title}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {sub.isPassed ? (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Passed</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(sub.createdAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
