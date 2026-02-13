import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { syncContentFn } from '@/server/admin.fn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/debug')({
    component: AdminDebugPage,
});

function AdminDebugPage() {
    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await syncContentFn();
            if (!res.success) {
                throw new Error(res.error || 'Sync failed');
            }
            return res;
        },
        onSuccess: () => {
            toast.success('Content synchronized successfully');
        },
        onError: (error) => {
            toast.error(`Sync failed: ${error.message}`);
        },
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">System Debug</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Content Synchronization
                        </CardTitle>
                        <CardDescription>
                            Manually trigger content extraction and database synchronization.
                            Useful if content gets out of sync with the database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                <p>Actions performed:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Extract Challenges from Seeders</li>
                                    <li>Sync Tutorials Metadata</li>
                                    <li>Sync Challenges Metadata</li>
                                </ul>
                            </div>

                            <Button
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                                className="w-full"
                            >
                                {syncMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>Sync Content Now</>
                                )}
                            </Button>

                            {syncMutation.isSuccess && (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                                    <CheckCircle className="h-4 w-4" />
                                    Last sync successful
                                </div>
                            )}

                            {syncMutation.isError && (
                                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    <XCircle className="h-4 w-4" />
                                    Last sync failed
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
