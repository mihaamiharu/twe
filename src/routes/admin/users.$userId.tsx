import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminUserDetail, deleteUser } from '@/server/admin/users.fn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';
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
    XCircle,
    Trash2,
    AlertTriangle
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

const routeApi = getRouteApi('/admin/users/$userId');

function UserDetailPage() {
    const { userId } = routeApi.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const deleteUserMutation = useMutation({
        mutationFn: async () => {
            const res = await deleteUser({ data: { userId } });
            if (!res.success) throw new Error(res.error || 'Failed to delete user');
            return res;
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            navigate({ to: '/admin/users' });
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

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
                                <p className="text-xs text-muted-foreground mt-1">
                                    Level {user.level || 1}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Challenges</span>
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                </div>
                                <div className="text-2xl font-bold mt-2">{user.completedChallengeCount}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {user.progressCount} attempted
                                </p>
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


            {/* Danger Zone */}
            <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader>
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle className="text-lg">Danger Zone</CardTitle>
                    </div>
                    <CardDescription>
                        Destructive actions for this user.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm">Delete User</h4>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete this user and all associated data (submissions, progress, etc).
                            </p>
                        </div>
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete User?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete <strong>{user.name || user.email}</strong> and remove their data from our servers.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        variant="destructive"
                                        onClick={() => deleteUserMutation.mutate()}
                                        disabled={deleteUserMutation.isPending}
                                    >
                                        {deleteUserMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
