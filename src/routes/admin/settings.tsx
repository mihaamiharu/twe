import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Settings as SettingsIcon,
    Globe,
    Lock,
    Bell,
    Database,
    RefreshCw,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/settings')({
    component: SettingsPage,
});

function SettingsPage() {
    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in text-card-foreground">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure platform behavior and environment variables.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <CardTitle>Public Visibility</CardTitle>
                        </div>
                        <CardDescription>
                            Control what guests can see on the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="public-leaderboard" className="flex flex-col gap-1">
                                <span>Public Leaderboard</span>
                                <span className="text-xs font-normal text-muted-foreground italic">Allow unauthenticated users to see rankings.</span>
                            </Label>
                            <Switch id="public-leaderboard" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tutorial-access" className="flex flex-col gap-1">
                                <span>Free Tutorial Access</span>
                                <span className="text-xs font-normal text-muted-foreground italic">Make all tutorials available without login.</span>
                            </Label>
                            <Switch id="tutorial-access" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            <CardTitle>Maintenance Mode</CardTitle>
                        </div>
                        <CardDescription>
                            Restrict platform access during updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenance-mode" className="flex flex-col gap-1">
                                <span>Global Maintenance</span>
                                <span className="text-xs font-normal text-muted-foreground italic">Only admins can log in.</span>
                            </Label>
                            <Switch id="maintenance-mode" />
                        </div>
                        <Button variant="outline" className="w-full gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Clear System Cache
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-red-500/20 bg-red-500/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-red-500" />
                            <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                        </div>
                        <CardDescription>
                            Irreversible destructive actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <Button variant="destructive" className="flex-1">
                            Reset All Submission Scores
                        </Button>
                        <Button variant="destructive" className="flex-1">
                            Rebuild Achievement Cache
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSave}>Save Configuration</Button>
            </div>
        </div>
    );
}
