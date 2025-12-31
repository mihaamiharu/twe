import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '@/lib/admin.fn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileCode, Trophy, AlertCircle, Activity, ArrowRight, Layout } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PopularChallenge {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  completionCount: number;
}

interface RecentSubmission {
  id: string;
  isPassed: boolean;
  createdAt: Date;
  userId: string;
  challengeId: string;
  code: string;
  xpEarned: number;
  executionTime: number | null;
  testsPassed: number;
  testsTotal: number;
  errorMessage: string | null;
  user: {
    name: string | null;
    image: string | null;
    email: string;
  };
  challenge: {
    title: string;
    slug: string;
  };
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
  loader: async ({ context }) => {
    const session = context.auth;
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      throw redirect({
        to: '/',
      });
    }
  }
});

function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await getAdminStats();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch stats');
      }
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied or Error Loading Stats</h2>
        <p className="mt-2 text-muted-foreground">Ensure you have admin privileges.</p>
        {/* Fallback link to home */}
        <a href="/" className="text-primary hover:underline mt-4 block">Return Home</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and analytics.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
          Admin Access
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Across all challenges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.popularChallenges.length}+</div>
            <p className="text-xs text-muted-foreground">Live and published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Submission Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Daily submissions over the last 30 days</p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.submissionsByDate}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: string) => value.split('-').slice(1).join('/')}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `${value}`}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={50}
                    activeBar={{ fill: '#60a5fa' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Challenges */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Most Popular Challenges</CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 by completion count</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularChallenges.map((challenge: PopularChallenge) => (
                <div key={challenge.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{challenge.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{challenge.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">{challenge.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-sm">
                    {challenge.completionCount}
                    <Users className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentActivity.map((submission: RecentSubmission, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {submission.user?.image && (
                        <img src={submission.user.image} alt={submission.user.name || 'User'} className="h-6 w-6 rounded-full" />
                      )}
                      <span>{submission.user?.name || 'Anonymous'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{submission.challenge?.title || 'Unknown Challenge'}</TableCell>
                  <TableCell>
                    <Badge variant={submission.isPassed ? 'default' : 'secondary'} className={submission.isPassed ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25' : ''}>
                      {submission.isPassed ? 'Passed' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/bugs" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/50 hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Bug Reports
              </CardTitle>
              <CardDescription>
                View and manage user-submitted issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                Go to Bug Manager <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* User Moderation */}
        <Link to="/admin/users" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/50 hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                User Moderation
              </CardTitle>
              <CardDescription>
                Manage user access and shadow bans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                Go to Users <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Challenge Manager */}
        <Link to="/admin/challenges" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/50 hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-500" />
                Challenge Manager
              </CardTitle>
              <CardDescription>
                Toggle challenge visibility and status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                Go to Challenges <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
