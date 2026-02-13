import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getAdminStats } from '@/server/admin.fn';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileCode,
  Trophy,
  AlertCircle,
  Activity,
  ArrowRight,
  Layout,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PopularChallenge {
  id: string;
  title: string | { en: string;[key: string]: string };
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
    title: string | { en: string;[key: string]: string };
    slug: string;
  };
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function TrendIndicator({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "flex items-center text-xs font-medium",
      isPositive ? "text-green-500" : "text-red-500"
    )}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDownRight className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </div>
  );
}

function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await getAdminStats();
      if (!res.success) {
        throw new Error(res.error || 'Failed to fetch stats');
      }
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">
          Access Denied or Error Loading Stats
        </h2>
        <p className="mt-2 text-muted-foreground">
          Ensure you have admin privileges.
        </p>
        <a href="/" className="text-primary hover:underline mt-4 block">
          Return Home
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Platform overview and analytics.
          </p>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 border-primary/20 bg-primary/5 text-primary"
        >
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
            <div className="flex items-center mt-1">
              <TrendIndicator value={stats.userGrowthPercent} />
              <span className="text-xs text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <div className="flex items-center mt-1">
              <TrendIndicator value={stats.submissionGrowthPercent} />
              <span className="text-xs text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Challenges
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.popularChallenges.length}+
            </div>
            <p className="text-xs text-muted-foreground mt-1">Live and published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users (7d)
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique solvers this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Row 1: Submissions & User Growth */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.submissionsByDate}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: string) =>
                      value.split('-').slice(1).join('/')
                    }
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
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={50}
                    activeBar={{ fill: '#60a5fa' }}
                    name="Submissions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Submission Success Rate</CardTitle>
            <CardDescription>All time pass vs fail ratio</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full flex items-center justify-center relative">
              {/* Simple custom Donut Chart visualization if Recharts Pie is too complex to setup quickly or just use text stats if preferred. 
                     Let's stick to a simple visual representation using progress bars or just metrics for now to ensure robustness.
                     Actually, let's try a simple Recharts Pie if we have it imported, otherwise simple stats.
                 */}
              {/* Fallback to simple stats for reliability */}
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-500">{stats.submissionStats.passed}</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wide mt-1">Passed</div>
                  </div>
                  <div className="h-16 w-[1px] bg-border"></div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-500">{stats.submissionStats.failed}</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wide mt-1">Failed</div>
                  </div>
                </div>

                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Success Rate</span>
                    <span>
                      {stats.submissionStats.passed + stats.submissionStats.failed > 0
                        ? Math.round((stats.submissionStats.passed / (stats.submissionStats.passed + stats.submissionStats.failed)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${stats.submissionStats.passed + stats.submissionStats.failed > 0
                          ? (stats.submissionStats.passed / (stats.submissionStats.passed + stats.submissionStats.failed)) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Row 2: User Growth & Bug Stats */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New registrations (Last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v.split('-').slice(1).join('/')} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Bug Reports Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.bugStats.OPEN + stats.bugStats.NEW + stats.bugStats.IN_PROGRESS}</span>
                <span className="text-xs font-semibold uppercase text-orange-600/70 dark:text-orange-400/70 mt-1">Active Issues</span>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.bugStats.RESOLVED}</span>
                <span className="text-xs font-semibold uppercase text-green-600/70 dark:text-green-400/70 mt-1">Resolved</span>
              </div>
              <div className="col-span-2 space-y-3 mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>New</span>
                  <span className="font-mono">{stats.bugStats.NEW}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>In Progress</span>
                  <span className="font-mono">{stats.bugStats.IN_PROGRESS}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-500"></div>Closed</span>
                  <span className="font-mono">{stats.bugStats.CLOSED}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Popular Challenges */}
        <Card className="col-span-3 lg:col-span-7">
          <CardHeader>
            <CardTitle>Most Popular Challenges</CardTitle>
            <p className="text-sm text-muted-foreground">
              Top 5 by completion count
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.popularChallenges.map((challenge: PopularChallenge) => (
                <div
                  key={challenge.id}
                  className="flex flex-col p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5"
                    >
                      {challenge.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1 font-bold text-sm text-muted-foreground">
                      {challenge.completionCount}
                      <Users className="h-3 w-3" />
                    </div>
                  </div>
                  <p className="font-semibold text-sm line-clamp-2 mb-1" title={typeof challenge.title === 'string' ? challenge.title : challenge.title?.en}>
                    {typeof challenge.title === 'object' ? challenge.title?.en : challenge.title}
                  </p>
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {challenge.slug}
                  </span>
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
              {stats.recentActivity.map(
                (submission: RecentSubmission, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {submission.user?.image && (
                          <img
                            src={submission.user.image}
                            alt={submission.user.name || 'User'}
                            className="h-6 w-6 rounded-full"
                          />
                        )}
                        <span>{submission.user?.name || 'Anonymous'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.challenge
                        ? (typeof submission.challenge.title === 'object'
                          ? submission.challenge.title.en
                          : submission.challenge.title)
                        : 'Unknown Challenge'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={submission.isPassed ? 'default' : 'secondary'}
                        className={
                          submission.isPassed
                            ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25'
                            : ''
                        }
                      >
                        {submission.isPassed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(submission.createdAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ),
              )}
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

        {/* System Debug */}
        <Link to="/admin/debug" className="block group">
          <Card className="h-full transition-colors hover:bg-muted/50 hover:border-primary/50 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-gray-500" />
                System Debug
              </CardTitle>
              <CardDescription>
                Sync content and view system status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-primary font-medium group-hover:underline">
                Go to Debug <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
