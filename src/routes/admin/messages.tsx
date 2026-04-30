import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminMessages, updateMessageStatus } from '@/server/admin/messages.fn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DataTablePagination } from '@/components/admin/data-table-pagination';

export const Route = createFileRoute('/admin/messages')({
    component: MessagesManager,
});

type MessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED';

function MessagesManager() {
    const queryClient = useQueryClient();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: messages, isLoading } = useQuery({
        queryKey: ['admin-messages'],
        queryFn: async () => {
            const res = await getAdminMessages();
            if (!res.success) throw new Error(res.error || 'Failed to fetch messages');
            return res.data;
        },
    });

    type Message = NonNullable<typeof messages>[number];

    const totalPages = Math.ceil((messages?.length || 0) / pageSize);
    const paginatedMessages = useMemo(() => {
        if (!messages) return [];
        const start = (currentPage - 1) * pageSize;
        return messages.slice(start, start + pageSize);
    }, [messages, currentPage, pageSize]);

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; status: MessageStatus }) => {
            const res = await updateMessageStatus({ data });
            if (!res.success) throw new Error(res.error || 'Failed to update message');
            return res;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
            toast.success('Message updated successfully');
            setIsOpen(false);
        },
        onError: () => {
            toast.error('Failed to update message');
        },
    });

    const handleView = (message: Message) => {
        setSelectedMessage(message);
        setIsOpen(true);
        // Mark as READ if NEW
        if (message.status === 'NEW') {
            updateMutation.mutate({ id: message.id, status: 'READ' });
        }
    };

    const handleStatusChange = (status: MessageStatus) => {
        if (!selectedMessage) return;
        updateMutation.mutate({ id: selectedMessage.id, status });
    };

    if (isLoading)
        return <div className="p-8 text-center">Loading messages...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <Link to="/admin">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage inquiries from the contact form.
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>Message Preview</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMessages.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center h-24 text-muted-foreground"
                                    >
                                        No messages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedMessages.map((msg) => (
                                    <TableRow key={msg.id}>
                                        <TableCell>
                                            <StatusBadge status={msg.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{msg.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {msg.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                            {msg.message}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleView(msg)}
                                            >
                                                View
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
                        totalItems={messages?.length || 0}
                    />
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    {selectedMessage && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Message Details</DialogTitle>
                                <DialogDescription>
                                    Sent by {selectedMessage.name} on{' '}
                                    {new Date(selectedMessage.createdAt).toLocaleString()}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">E-mail</Label>
                                        <div className="text-sm font-medium">
                                            <a
                                                href={`mailto:${selectedMessage.email}`}
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <Mail className="h-3 w-3" />
                                                {selectedMessage.email}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">
                                            Status
                                        </Label>
                                        <div>
                                            <StatusBadge status={selectedMessage.status} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold">Message</Label>
                                    <div className="border p-4 rounded-md bg-muted/30 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                        {selectedMessage.message}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <div className="flex gap-2 w-full justify-between">
                                    <div className="flex gap-2">
                                        {selectedMessage.status !== 'ARCHIVED' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleStatusChange('ARCHIVED')}
                                                disabled={updateMutation.isPending}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                Archive
                                            </Button>
                                        )}
                                        {selectedMessage.status !== 'REPLIED' && (
                                            <Button
                                                variant="outline"
                                                onClick={() => handleStatusChange('REPLIED')}
                                                disabled={updateMutation.isPending}
                                            >
                                                Mark Replied
                                            </Button>
                                        )}
                                    </div>
                                    <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                        Close
                                    </Button>
                                </div>
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
        case 'READ':
            return (
                <Badge
                    variant="outline"
                    className="bg-purple-500/10 text-purple-500 border-purple-500/20"
                >
                    Read
                </Badge>
            );
        case 'REPLIED':
            return (
                <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                >
                    Replied
                </Badge>
            );
        case 'ARCHIVED':
            return <Badge variant="secondary">Archived</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}
