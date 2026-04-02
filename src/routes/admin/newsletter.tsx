import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminSubscribers, updateSubscriberStatus } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download } from 'lucide-react';
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
import { useState, useMemo } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Route = createFileRoute('/admin/newsletter')({
    component: NewsletterManager,
});

type SubscriberStatus = 'PENDING' | 'CONFIRMED' | 'UNSUBSCRIBED';

function NewsletterManager() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: subscribers, isLoading } = useQuery({
        queryKey: ['admin-subscribers'],
        queryFn: async () => {
            const res = await getAdminSubscribers();
            if (!res.success)
                throw new Error(res.error || 'Failed to fetch subscribers');
            return res.data;
        },
    });

    const totalPages = Math.ceil((subscribers?.length || 0) / pageSize);
    const paginatedSubscribers = useMemo(() => {
        if (!subscribers) return [];
        const start = (currentPage - 1) * pageSize;
        return subscribers.slice(start, start + pageSize);
    }, [subscribers, currentPage, pageSize]);

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; status: SubscriberStatus }) => {
            const res = await updateSubscriberStatus({ data });
            if (!res.success)
                throw new Error(res.error || 'Failed to update subscriber');
            return res;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
            toast.success('Subscriber updated successfully');
        },
        onError: () => {
            toast.error('Failed to update subscriber');
        },
    });

    const handleExportCSV = () => {
        if (!subscribers) return;

        const headers = ['Email', 'Status', 'Date Subscribed', 'Date Confirmed'];
        const csvContent = [
            headers.join(','),
            ...subscribers.map((sub) =>
                [
                    sub.email,
                    sub.status,
                    new Date(sub.createdAt).toISOString(),
                    sub.confirmedAt ? new Date(sub.confirmedAt).toISOString() : '',
                ].join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`,
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading)
        return <div className="p-8 text-center">Loading subscribers...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage subscribers and exports.
                        </p>
                    </div>
                </div>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Subscribed</TableHead>
                                <TableHead>Confirmed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedSubscribers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No subscribers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedSubscribers.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <StatusBadge status={sub.status} />
                                        </TableCell>
                                        <TableCell className="font-medium">{sub.email}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {sub.confirmedAt
                                                ? new Date(sub.confirmedAt).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        Manage
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            updateMutation.mutate({
                                                                id: sub.id,
                                                                status: 'CONFIRMED',
                                                            })
                                                        }
                                                        disabled={sub.status === 'CONFIRMED'}
                                                    >
                                                        Mark Confirmed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            updateMutation.mutate({
                                                                id: sub.id,
                                                                status: 'UNSUBSCRIBED',
                                                            })
                                                        }
                                                        disabled={sub.status === 'UNSUBSCRIBED'}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        Unsubscribe
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                        totalItems={subscribers?.length || 0}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PENDING':
            return (
                <Badge
                    variant="outline"
                    className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                >
                    Pending
                </Badge>
            );
        case 'CONFIRMED':
            return (
                <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                >
                    Confirmed
                </Badge>
            );
        case 'UNSUBSCRIBED':
            return <Badge variant="secondary">Unsubscribed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}
