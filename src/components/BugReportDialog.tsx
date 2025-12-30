/**
 * BugReportDialog - Interactive QA-style bug report form
 * 
 * Features:
 * - Severity selection with color-coded badges
 * - Steps to reproduce with numbered list guidance
 * - Expected vs Actual behavior fields
 * - Auto-captures page URL and browser info
 * - Works for both logged-in and anonymous users
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Bug, Loader2, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/auth.client';
import { trackEvent } from '@/lib/analytics';
import { createBugReport } from '@/lib/bug-reports.fn';

// Form validation schema
const bugReportFormSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    stepsToReproduce: z.string().min(10, 'Please provide detailed steps to reproduce the bug'),
    expectedBehavior: z.string().min(10, 'Please describe what you expected to happen'),
    actualBehavior: z.string().min(10, 'Please describe what actually happened'),
    email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

type BugReportFormData = z.infer<typeof bugReportFormSchema>;

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Severity badge styles
const severityConfig: Record<Severity, { label: string; color: string; icon: typeof AlertTriangle }> = {
    CRITICAL: { label: 'Critical', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertTriangle },
    HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertCircle },
    MEDIUM: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Info },
    LOW: { label: 'Low', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
};

interface BugReportDialogProps {
    trigger?: React.ReactNode;
    className?: string;
}

export function BugReportDialog({ trigger, className }: BugReportDialogProps) {
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    const form = useForm<BugReportFormData>({
        resolver: zodResolver(bugReportFormSchema),
        defaultValues: {
            title: '',
            severity: 'MEDIUM',
            stepsToReproduce: '',
            expectedBehavior: '',
            actualBehavior: '',
            email: '',
        },
    });

    const submitMutation = useMutation({
        mutationFn: async (data: BugReportFormData) => {
            const response = await createBugReport({
                data: {
                    ...data,
                    pageUrl: window.location.href,
                    browserInfo: navigator.userAgent,
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to submit bug report');
            }

            return response.data;
        },
        onSuccess: () => {
            toast.success('Bug report submitted!', {
                description: 'Thank you for helping us improve.',
            });

            // Track analytics
            trackEvent('bug_report_submitted', { title: form.getValues('title') });

            form.reset();
            setOpen(false);
        },
        onError: (error: Error) => {
            toast.error('Failed to submit bug report', {
                description: error.message,
            });
        },
    });

    const onSubmit = (data: BugReportFormData) => {
        submitMutation.mutate(data);
    };

    const selectedSeverity = form.watch('severity');
    const SeverityIcon = severityConfig[selectedSeverity]?.icon || Info;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
                        <Bug className="h-4 w-4" />
                        Report Bug
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-destructive" />
                        Report a Bug
                    </DialogTitle>
                    <DialogDescription>
                        Help us improve by reporting issues you find. Please be as detailed as possible.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <form id="bug-report-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Bug Title *</Label>
                            <Input
                                id="title"
                                placeholder="Brief description of the issue"
                                {...form.register('title')}
                            />
                            {form.formState.errors.title && (
                                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                            )}
                        </div>

                        {/* Severity */}
                        <div className="space-y-2">
                            <Label>Severity *</Label>
                            <Select
                                value={form.watch('severity')}
                                onValueChange={(value: Severity) => form.setValue('severity', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(severityConfig).map(([key, config]) => {
                                        const Icon = config.icon;
                                        return (
                                            <SelectItem key={key} value={key}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={cn('border', config.color)}>
                                                        <Icon className="h-3 w-3 mr-1 text-current" />
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            {/* Severity Guide */}
                            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 space-y-1">
                                <p><strong>Critical:</strong> App is unusable, data loss, security issue</p>
                                <p><strong>High:</strong> Major feature broken, no workaround</p>
                                <p><strong>Medium:</strong> Feature works but with issues</p>
                                <p><strong>Low:</strong> Minor issue, cosmetic problem</p>
                            </div>
                        </div>

                        {/* Steps to Reproduce */}
                        <div className="space-y-2">
                            <Label htmlFor="stepsToReproduce">Steps to Reproduce *</Label>
                            <Textarea
                                id="stepsToReproduce"
                                placeholder={`1. Go to the page "..."
2. Click on "..."
3. Enter "..." in the field
4. Observe the error`}
                                rows={5}
                                {...form.register('stepsToReproduce')}
                            />
                            {form.formState.errors.stepsToReproduce && (
                                <p className="text-sm text-destructive">{form.formState.errors.stepsToReproduce.message}</p>
                            )}
                        </div>

                        {/* Expected vs Actual Behavior */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="expectedBehavior">Expected Behavior *</Label>
                                <Textarea
                                    id="expectedBehavior"
                                    placeholder="What should happen?"
                                    rows={4}
                                    {...form.register('expectedBehavior')}
                                />
                                {form.formState.errors.expectedBehavior && (
                                    <p className="text-sm text-destructive">{form.formState.errors.expectedBehavior.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="actualBehavior">Actual Behavior *</Label>
                                <Textarea
                                    id="actualBehavior"
                                    placeholder="What actually happened?"
                                    rows={4}
                                    {...form.register('actualBehavior')}
                                />
                                {form.formState.errors.actualBehavior && (
                                    <p className="text-sm text-destructive">{form.formState.errors.actualBehavior.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Email (only for anonymous users) */}
                        {!isLoggedIn && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Your Email (optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="For follow-up questions"
                                    {...form.register('email')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    We may contact you if we need more information.
                                </p>
                                {form.formState.errors.email && (
                                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                        )}

                        {/* Auto-captured info notice */}
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
                            <p className="font-medium mb-1">Auto-captured information:</p>
                            <p>• Current page URL</p>
                            <p>• Browser information</p>
                            {isLoggedIn && <p>• Your user account</p>}
                        </div>

                        {/* Submit Button */}
                    </form>
                </div>

                <div className="p-6 pt-2 border-t mt-auto shrink-0 bg-background">
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="bug-report-form"
                            disabled={submitMutation.isPending}
                            variant="destructive"
                        >
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Bug className="h-4 w-4 mr-2" />
                                    Submit Bug Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default BugReportDialog;
