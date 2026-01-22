import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminBugs, updateBugStatus } from '@/server/admin.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
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
import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTablePagination } from '@/components/admin/data-table-pagination';

type BugStatus =
  | 'NEW'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'WONT_FIX';

export const Route = createFileRoute('/admin/bugs')({
  component: BugManager,
});

function BugManager() {
  const queryClient = useQueryClient();
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [status, setStatus] = useState<BugStatus>('OPEN');
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: bugs, isLoading } = useQuery({
    queryKey: ['admin-bugs'],
    queryFn: async () => {
      const res = await getAdminBugs();
      if (!res.success) throw new Error(res.error || 'Failed to fetch bugs');
      return res.data;
    },
  });

  type BugReport = NonNullable<typeof bugs>[number];

  const totalPages = Math.ceil((bugs?.length || 0) / pageSize);
  const paginatedBugs = useMemo(() => {
    if (!bugs) return [];
    const start = (currentPage - 1) * pageSize;
    return bugs.slice(start, start + pageSize);
  }, [bugs, currentPage, pageSize]);

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      status?: BugStatus;
      adminNotes?: string;
    }) => {
      const res = await updateBugStatus({ data });
      if (!res.success) throw new Error(res.error || 'Failed to update bug');
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bugs'] });
      toast.success('Bug report updated successfully');
      setIsOpen(false);
    },
    onError: () => {
      toast.error('Failed to update bug report');
    },
  });

  const handleEdit = (bug: BugReport) => {
    setSelectedBug(bug);
    setAdminNote(bug.adminNotes || '');
    setStatus(bug.status);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!selectedBug) return;
    updateMutation.mutate({
      id: selectedBug.id,
      status: status,
      adminNotes: adminNote,
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading bugs...</div>;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bug Reports</h1>
          <p className="text-muted-foreground mt-1">
            Manage user-submitted issues.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBugs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No bug reports found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBugs.map((bug) => (
                  <TableRow key={bug.id}>
                    <TableCell>
                      <StatusBadge status={bug.status} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={bug.severity} />
                    </TableCell>
                    <TableCell
                      className="font-medium max-w-[300px] truncate"
                      title={bug.title}
                    >
                      {bug.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {bug.user?.image && (
                          <img
                            src={bug.user.image}
                            className="h-5 w-5 rounded-full"
                          />
                        )}
                        <span className="text-sm">
                          {bug.user?.name || bug.reporterEmail || 'Anonymous'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(bug)}
                      >
                        Manage
                      </Button>
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
            totalItems={bugs?.length || 0}
          />
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedBug && (
            <>
              <DialogHeader>
                <DialogTitle>Manage Bug Report</DialogTitle>
                <DialogDescription>
                  Reported by{' '}
                  {selectedBug.user?.name ||
                    selectedBug.reporterEmail ||
                    'Anonymous'}{' '}
                  on {new Date(selectedBug.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label className="font-semibold">Title</Label>
                  <div className="border p-2 rounded-md bg-muted/50 text-sm">
                    {selectedBug.title}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Steps to Reproduce</Label>
                  <div className="border p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                    {selectedBug.stepsToReproduce}
                  </div>
                </div>

                {selectedBug.expectedBehavior && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Expected Behavior</Label>
                    <div className="border p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                      {selectedBug.expectedBehavior}
                    </div>
                  </div>
                )}

                {selectedBug.actualBehavior && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Actual Behavior</Label>
                    <div className="border p-2 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                      {selectedBug.actualBehavior}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as BugStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">New</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">
                          Closed (Won't Fix)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Internal notes about resolution..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'NEW':
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-500 border-blue-500/20"
        >
          New
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        >
          In Progress
        </Badge>
      );
    case 'RESOLVED':
      return (
        <Badge
          variant="outline"
          className="bg-green-500/10 text-green-500 border-green-500/20"
        >
          Resolved
        </Badge>
      );
    case 'CLOSED':
      return <Badge variant="secondary">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case 'CRITICAL':
      return (
        <div className="flex items-center text-red-500 font-medium text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" /> Critical
        </div>
      );
    case 'HIGH':
      return <div className="text-orange-500 font-medium text-xs">High</div>;
    case 'MEDIUM':
      return <div className="text-yellow-500 font-medium text-xs">Medium</div>;
    case 'LOW':
      return <div className="text-green-500 font-medium text-xs">Low</div>;
    default:
      return <span className="text-muted-foreground text-xs">{severity}</span>;
  }
}
