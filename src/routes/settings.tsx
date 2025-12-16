import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, User, Shield, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
});

interface UserData {
    id: string;
    email: string;
    name: string;
    image?: string;
    profileVisibility: 'PUBLIC' | 'PRIVATE';
    showOnLeaderboard: boolean;
}

function SettingsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['user', 'settings'],
        queryFn: async () => {
            const response = await fetch('/api/users/me');
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch settings');
            }
            const json = await response.json();
            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch settings');
            }
            return json.data as UserData;
        },
    });

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
        const isUnauthorized = error.message === 'Unauthorized';
        return (
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-2xl mx-auto">
                    <Card className="glass-card">
                        <CardContent className="py-12 text-center">
                            <h1 className="text-2xl font-bold mb-4">
                                {isUnauthorized ? 'Sign in Required' : 'Error'}
                            </h1>
                            <p className="text-muted-foreground mb-6">
                                {isUnauthorized
                                    ? 'Please sign in to access your settings.'
                                    : error.message}
                            </p>
                            <Button asChild>
                                <Link to={isUnauthorized ? '/login' : '/'}>
                                    {isUnauthorized ? 'Sign In' : 'Go Home'}
                                </Link>
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
                        to="/profile"
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

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Privacy
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Settings */}
                    <TabsContent value="profile">
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
                                        defaultValue={data?.name || ''}
                                        placeholder="Your display name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        defaultValue={data?.email || ''}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Email cannot be changed
                                    </p>
                                </div>
                                <Button className="mt-4">Save Changes</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Settings */}
                    <TabsContent value="privacy">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Privacy Settings</CardTitle>
                                <CardDescription>
                                    Control who can see your profile and activity
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Public Profile</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow others to see your profile
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data?.profileVisibility === 'PUBLIC'}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Show on Leaderboard</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Appear in public leaderboards
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data?.showOnLeaderboard}
                                    />
                                </div>
                                <Button className="mt-4">Save Privacy Settings</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Notification Preferences</CardTitle>
                                <CardDescription>
                                    Choose what notifications you receive
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Achievement Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified when you unlock achievements
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>New Challenges</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Get notified about new challenges
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Weekly Digest</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive a weekly summary of your progress
                                        </p>
                                    </div>
                                    <Switch />
                                </div>
                                <Button className="mt-4">Save Notification Settings</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
