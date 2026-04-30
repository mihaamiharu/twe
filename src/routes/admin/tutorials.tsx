import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminTutorials, updateTutorialStatus } from '@/server/admin/tutorials.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Eye, Clock } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/tutorials')({
    component: TutorialsManager,
});

function TutorialsManager() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: tutorials, isLoading } = useQuery({
        queryKey: ['admin-tutorials'],
        queryFn: async () => {
            const res = await getAdminTutorials();
            if (!res.success) throw new Error(res.error || 'Failed to fetch tutorials');
            return res.data;
        },
    });

    const filteredTutorials = useMemo(() => {
        if (!tutorials) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return tutorials;
        return tutorials.filter((t) => {
            const title = typeof t.title === 'object' ? t.title.en : t.title;
            return title.toLowerCase().includes(query) || t.slug.toLowerCase().includes(query);
        });
    }, [tutorials, searchQuery]);

    const totalPages = Math.ceil(filteredTutorials.length / pageSize);
    const paginatedTutorials = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTutorials.slice(start, start + pageSize);
    }, [filteredTutorials, currentPage, pageSize]);

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; isPublished: boolean }) => {
            const res = await updateTutorialStatus({ data });
            if (!res.success) throw new Error(res.error || 'Failed to update tutorial');
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] });
            toast.success('Tutorial visibility updated');
        },
        onError: () => {
            toast.error('Failed to update tutorial');
        },
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading tutorials...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in text-card-foreground">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tutorials Manager</h1>
                <p className="text-muted-foreground mt-1">
                    Manage step-by-step learning content.
                </p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tutorials..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tutorial</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Published</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTutorials.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No tutorials found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTutorials.map((tut) => (
                                    <TableRow key={tut.id}>
                                        <TableCell>
                                            <div className="flex flex-col py-1">
                                                <span className="font-semibold text-sm">
                                                    {typeof tut.title === 'object' ? tut.title.en : tut.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    /{tut.slug}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {tut.viewCount || 0} views
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(tut.createdAt).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={tut.isPublished}
                                                onCheckedChange={(checked) =>
                                                    updateMutation.mutate({
                                                        id: tut.id,
                                                        isPublished: checked,
                                                    })
                                                }
                                                disabled={updateMutation.isPending}
                                            />
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
                        totalItems={filteredTutorials.length}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
