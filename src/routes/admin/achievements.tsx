import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAdminAchievements } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Search, Users, ShieldCheck } from 'lucide-react';
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

export const Route = createFileRoute('/admin/achievements')({
    component: AchievementsManager,
});

function AchievementsManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: achievements, isLoading } = useQuery({
        queryKey: ['admin-achievements'],
        queryFn: async () => {
            const res = await getAdminAchievements();
            if (!res.success) throw new Error(res.error || 'Failed to fetch achievements');
            return res.data;
        },
    });

    const filteredAchievements = useMemo(() => {
        if (!achievements) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return achievements;
        return achievements.filter((a) =>
            a.name.toLowerCase().includes(query) ||
            a.slug.toLowerCase().includes(query)
        );
    }, [achievements, searchQuery]);

    const totalPages = Math.ceil(filteredAchievements.length / pageSize);
    const paginatedAchievements = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredAchievements.slice(start, start + pageSize);
    }, [filteredAchievements, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (isLoading) return <div className="p-8 text-center animate-pulse">Loading achievements...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in text-card-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage platform milestones.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 gap-2 flex items-center bg-primary/5 border-primary/20 text-primary">
                    <Award className="h-4 w-4" />
                    {achievements?.length} Total Achievements
                </Badge>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search achievements..."
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
                                <TableHead>Achievement</TableHead>
                                <TableHead>Rarity</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead className="text-right">Unlocks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedAchievements.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No achievements found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedAchievements.map((ach) => (
                                    <TableRow key={ach.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0 border border-primary/5">
                                                    {ach.icon || '🏅'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">
                                                        {(ach.name as any).en || ach.name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[300px]">
                                                        {(ach.description as any).en || ach.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] uppercase font-bold tracking-wider",
                                                    ach.rarity === 'LEGENDARY' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                                                    ach.rarity === 'EPIC' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                                                    ach.rarity === 'RARE' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                                                    ach.rarity === 'COMMON' && "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
                                                )}
                                            >
                                                {ach.rarity}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {ach.slug}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-medium">{ach.unlockCount}</span>
                                            </div>
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
                        totalItems={filteredAchievements.length}
                    />
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-card/50 border-dashed">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Automatic System</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Achievements are triggered automatically based on database events.
                            Admins can monitor unlock rates to tune difficulty.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper to make cn available in this file or imported
import { cn } from '@/lib/utils';
