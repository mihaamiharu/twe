import { createFileRoute, Link, useParams, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { RootContext } from '../../__root';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { getUserSettings, updateUserProfile } from '@/server/user.fn';

export const Route = createFileRoute('/$locale/_authenticated/settings')({
    beforeLoad: ({ context, params }) => {
        const { auth } = context as RootContext;
        if (!auth.isAuthenticated) {
            throw redirect({
                to: '/$locale/login',
                params: { locale: params.locale }
            });
        }
    },
    component: SettingsPage,
});

function SettingsPage() {
    const { locale } = useParams({ from: '/$locale/_authenticated/settings' });
    const { t } = useTranslation(['common']);
    const queryClient = useQueryClient();
    const [name, setName] = useState('');

    // Auth is guaranteed by _authenticated parent route
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', 'settings'],
        queryFn: async () => {
            const result = await getUserSettings();
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to fetch settings');
            }
            return result.data;
        },
    });

    // Update form when data is loaded
    useEffect(() => {
        if (data?.name) {
            setName(data.name);
        }
    }, [data]);

    const updateProfileMutation = useMutation({
        mutationFn: async (newName: string) => {
            const result = await updateUserProfile({ data: { name: newName } });
            if (!result.success) {
                throw new Error(result.error || 'Failed to update profile');
            }
            return result.data as { name?: string; email?: string;[key: string]: unknown };
        },
        onSuccess: async () => {
            toast.success('Settings updated', {
                description: 'Your profile information has been saved.',
            });
            await queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: Error) => {
            toast.error('Update failed', {
                description: error.message,
            });
        },
    });

    const handleSave = () => {
        if (!name.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        updateProfileMutation.mutate(name);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 md:p-10 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-2xl mx-auto">
                    <Card className="glass-card">
                        <CardContent className="py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                            <h1 className="text-2xl font-bold mb-4">Error</h1>
                            <p className="text-muted-foreground mb-6">{error.message}</p>
                            <Button asChild>
                                <Link to="/$locale/" params={{ locale }}>Go Home</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/$locale/_authenticated/profile"
                        params={{ locale }}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Profile Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your public profile information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your display name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    defaultValue={data?.email || ''}
                                    disabled
                                    className="opacity-60 cursor-not-allowed bg-muted/20"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>
                            <Button
                                className="mt-4"
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
