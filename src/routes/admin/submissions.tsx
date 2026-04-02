import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAdminSubmissions } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileCode,
    Search,
    Filter,
    Terminal,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { type LocalizedString } from '@/lib/content.types';

export const Route = createFileRoute('/admin/submissions')({
    component: SubmissionsManager,
});

interface AdminSubmission {
    id: string;
    createdAt: Date | string;
    isPassed: boolean;
    executionTime: number | null;
    xpEarned: number;
    testsPassed: number;
    testsTotal: number;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    } | null;
    challenge: {
        title: LocalizedString;
        slug: string;
    } | null;
}

function SubmissionsManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: submissions, isLoading } = useQuery({
        queryKey: ['admin-submissions'],
        queryFn: async () => {
            const res = await getAdminSubmissions();
            if (!res.success) throw new Error(res.error || 'Failed to fetch submissions');
            return res.data as AdminSubmission[];
        },
    });

    const filteredSubmissions = useMemo(() => {
        if (!submissions) return [];

        const query = searchQuery.toLowerCase().trim();

        return submissions.filter((sub) => {
            const challengeTitle = sub.challenge?.title.en.toLowerCase() || '';
            const userName = sub.user?.name?.toLowerCase() || '';
            const userEmail = sub.user?.email?.toLowerCase() || '';

            const matchesSearch =
                userName.includes(query) ||
                userEmail.includes(query) ||
                challengeTitle.includes(query);

            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'PASSED' && sub.isPassed) ||
                (statusFilter === 'FAILED' && !sub.isPassed);

            return matchesSearch && matchesStatus;
        });
    }, [submissions, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredSubmissions.length / pageSize);
    const paginatedSubmissions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSubmissions.slice(start, start + pageSize);
    }, [filteredSubmissions, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading submissions...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Submissions History</h1>
                <p className="text-muted-foreground mt-1">
                    Monitor all user attempts and performance.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user or challenge..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                        value={statusFilter}
                        onValueChange={(v: 'ALL' | 'PASSED' | 'FAILED') => setStatusFilter(v)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PASSED">Passed Only</SelectItem>
                            <SelectItem value="FAILED">Failed Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Challenge</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Execution</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Submitted</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedSubmissions.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No submissions found matching filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedSubmissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    {sub.user?.image ? (
                                                        <img src={sub.user.image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-primary">{(sub.user?.name || 'A')[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">{sub.user?.name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate">{sub.user?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {sub.challenge?.title.en || 'Unknown Challenge'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {sub.challenge?.slug}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {sub.isPassed ? (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 pr-2">
                                                    <CheckCircle2 className="h-3 w-3" /> Passed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1 pr-2">
                                                    <XCircle className="h-3 w-3" /> Failed
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {sub.executionTime ? `${sub.executionTime}ms` : 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Terminal className="h-3 w-3" />
                                                    {sub.xpEarned} XP
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 w-24">
                                                <div className="flex justify-between text-[10px]">
                                                    <span>Tests</span>
                                                    <span>{sub.testsPassed}/{sub.testsTotal}</span>
                                                </div>
                                                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={sub.isPassed ? "h-full bg-green-500" : "h-full bg-red-500"}
                                                        style={{ width: `${(sub.testsPassed / sub.testsTotal) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(sub.createdAt).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
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
                        totalItems={filteredSubmissions.length}
                    />
                </CardContent>
            </Card>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-sm text-blue-700 dark:text-blue-400">
                <FileCode className="h-5 w-5 shrink-0" />
                <div>
                    <p className="font-semibold">Pro Tip: Deep Inspection</p>
                    <p className="mt-1 opacity-90">
                        Click on a submission row (coming soon!) to view the raw code submitted and detailed test failure messages.
                        Currently showing the legacy list view with real-time sync.
                    </p>
                </div>
            </div>
        </div>
    );
}
