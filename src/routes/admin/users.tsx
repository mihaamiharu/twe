import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateUserStatus } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, ShieldAlert, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: 'USER' | 'ADMIN';
  showOnLeaderboard: boolean;
  submissionCount: number;
  createdAt: Date;
}

export const Route = createFileRoute('/admin/users')({
  component: UserManager,
});

function UserManager() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await getAdminUsers();
      if (!res.success) throw new Error(res.error || 'Failed to fetch users');
      return res.data;
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const query = searchQuery.toLowerCase().trim();
    const result = query
      ? users.filter(
        (user: AdminUser) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.id?.toLowerCase().includes(query),
      )
      : users;

    return result;
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const toggleBanMutation = useMutation({
    mutationFn: async ({
      id,
      showOnLeaderboard,
    }: {
      id: string;
      showOnLeaderboard: boolean;
    }) => {
      console.log('Mutating user:', id, 'Show:', showOnLeaderboard);
      const res = await updateUserStatus({ data: { id, showOnLeaderboard } });
      if (!res.success) throw new Error(res.error || 'Failed to update user');
      return res;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(
        ['admin-users'],
        (oldData: AdminUser[] | undefined) => {
          return oldData?.map((user) =>
            user.id === variables.id
              ? { ...user, showOnLeaderboard: variables.showOnLeaderboard }
              : user,
          );
        },
      );
      const status = variables.showOnLeaderboard
        ? 'Visible'
        : 'Hidden (Shadow Banned)';
      toast.success(`User updated: ${status}`);
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to update user');
    },
  });

  if (isLoading)
    return (
      <div className="p-8 text-center animate-pulse">Loading users...</div>
    );

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Manage user visibility and access.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or ID..."
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">
                  Leaderboard Visibility
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    {searchQuery
                      ? `No users matching "${searchQuery}"`
                      : 'No users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user: AdminUser) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onToggle={(checked) =>
                      toggleBanMutation.mutate({
                        id: user.id,
                        showOnLeaderboard: checked,
                      })
                    }
                    isPending={
                      toggleBanMutation.isPending &&
                      toggleBanMutation.variables?.id === user.id
                    }
                  />
                ))
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            setPageSize={setPageSize}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
          />
        </CardContent>
      </Card>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3 text-sm text-yellow-700 dark:text-yellow-400">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">What is a Shadow Ban?</p>
          <p className="mt-1 opacity-90">
            Disabling "Leaderboard Visibility" will hide the user from all
            public leaderboards and rankings. They can still log in and solve
            challenges, but their activity won't be visible to others. This is
            effective for spam accounts or bad actors.
          </p>
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onToggle,
  isPending,
}: {
  user: AdminUser;
  onToggle: (c: boolean) => void;
  isPending: boolean;
}) {
  const isAdmin = user.role === 'ADMIN';

  return (
    <TableRow>
      <TableCell>
        <Link
          to="/admin/users/$userId"
          params={{ userId: user.id }}
          className="flex items-center gap-3 group transition-colors hover:bg-muted/50 p-1 -m-1 rounded-lg"
        >
          <Avatar className="h-9 w-9 border border-border group-hover:border-primary/50 transition-colors">
            <AvatarImage
              src={user.image ?? undefined}
              alt={user.name ?? undefined}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name?.substring(0, 2).toUpperCase() || 'AN'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
              {user.name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {user.id}
            </span>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <Badge
          variant={isAdmin ? 'default' : 'secondary'}
          className={
            isAdmin
              ? 'bg-purple-500/15 text-purple-600 hover:bg-purple-500/25'
              : ''
          }
        >
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          {user.submissionCount}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span
            className={`text-xs font-medium ${user.showOnLeaderboard ? 'text-green-600' : 'text-red-500'}`}
          >
            {user.showOnLeaderboard ? 'Visible' : 'Shadow Banned'}
          </span>

          {isAdmin ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="opacity-50 cursor-not-allowed">
                    <Switch checked={true} disabled />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cannot shadow ban Admin users</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Switch
              id={`user-switch-${user.id}`}
              checked={user.showOnLeaderboard}
              onCheckedChange={onToggle}
              disabled={isPending}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
