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

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import {
  Bug,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { authQueryOptions } from '@/lib/auth.query';
import { trackEvent } from '@/lib/analytics';
import { createBugReport } from '@/server/bug-reports.fn';
import { showAchievementToast } from './achievement-toast';

// Helper functions need to be moved or keep them here but typed correctly
const getBugReportSchema = (t: TFunction) =>
  z.object({
    title: z.string().min(5, t('bugs:validation.titleTooShort')).max(200),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    stepsToReproduce: z.string().min(10, t('bugs:validation.stepsTooShort')),
    expectedBehavior: z.string().min(10, t('bugs:validation.expectedTooShort')),
    actualBehavior: z.string().min(10, t('bugs:validation.actualTooShort')),
    email: z
      .string()
      .email(t('bugs:validation.invalidEmail'))
      .optional()
      .or(z.literal('')),
  });

type BugReportFormData = z.infer<ReturnType<typeof getBugReportSchema>>;

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Severity badge styles
const getSeverityConfig = (
  t: TFunction,
): Record<
  Severity,
  { label: string; color: string; icon: typeof AlertTriangle }
> => ({
  CRITICAL: {
    label: t('bugs:form.severity.critical'),
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: AlertTriangle,
  },
  HIGH: {
    label: t('bugs:form.severity.high'),
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    icon: AlertCircle,
  },
  MEDIUM: {
    label: t('bugs:form.severity.medium'),
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Info,
  },
  LOW: {
    label: t('bugs:form.severity.low'),
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle,
  },
});

interface BugReportDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function BugReportDialog({ trigger, className }: BugReportDialogProps) {
  const { t } = useTranslation(['bugs', 'common']);
  const [open, setOpen] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const session = auth;
  const isLoggedIn = !!session?.user;

  const severityConfig = useMemo(() => getSeverityConfig(t), [t]);
  const bugReportFormSchema = useMemo(() => getBugReportSchema(t), [t]);

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
        },
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit bug report');
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t('bugs:toast.success.title'), {
        description: t('bugs:toast.success.description'),
      });

      if (data.newAchievement) {
        showAchievementToast(data.newAchievement);
      }

      // Track analytics
      trackEvent('bug_report_submitted', { title: form.getValues('title') });

      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(t('bugs:toast.error.title'), {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: BugReportFormData) => {
    if (localSubmitting) return;
    setLocalSubmitting(true);
    submitMutation.mutate(data, {
      onSettled: () => setLocalSubmitting(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
            <Bug className="h-4 w-4" />
            {t('bugs:dialog.trigger')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            {t('bugs:dialog.title')}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="px-6 py-1">
          {t('bugs:dialog.description')}
        </DialogDescription>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <form
            id="bug-report-form"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className="space-y-6"
          >
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('bugs:form.title.label')}</Label>
              <Input
                id="title"
                placeholder={t('bugs:form.title.placeholder')}
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>{t('bugs:form.severity.label')}</Label>
              <Select
                value={form.watch('severity')}
                onValueChange={(value: Severity) =>
                  form.setValue('severity', value)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t('bugs:form.severity.placeholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(severityConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn('border', config.color)}
                          >
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
                <p>
                  <strong>{t('bugs:form.severity.critical')}:</strong>{' '}
                  {t('bugs:form.severity.guide.critical')}
                </p>
                <p>
                  <strong>{t('bugs:form.severity.high')}:</strong>{' '}
                  {t('bugs:form.severity.guide.high')}
                </p>
                <p>
                  <strong>{t('bugs:form.severity.medium')}:</strong>{' '}
                  {t('bugs:form.severity.guide.medium')}
                </p>
                <p>
                  <strong>{t('bugs:form.severity.low')}:</strong>{' '}
                  {t('bugs:form.severity.guide.low')}
                </p>
              </div>
            </div>

            {/* Steps to Reproduce */}
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">
                {t('bugs:form.steps.label')}
              </Label>
              <Textarea
                id="stepsToReproduce"
                placeholder={t('bugs:form.steps.placeholder')}
                rows={5}
                {...form.register('stepsToReproduce')}
              />
              {form.formState.errors.stepsToReproduce && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.stepsToReproduce.message}
                </p>
              )}
            </div>

            {/* Expected vs Actual Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedBehavior">
                  {t('bugs:form.expected.label')}
                </Label>
                <Textarea
                  id="expectedBehavior"
                  placeholder={t('bugs:form.expected.placeholder')}
                  rows={4}
                  {...form.register('expectedBehavior')}
                />
                {form.formState.errors.expectedBehavior && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.expectedBehavior.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualBehavior">
                  {t('bugs:form.actual.label')}
                </Label>
                <Textarea
                  id="actualBehavior"
                  placeholder={t('bugs:form.actual.placeholder')}
                  rows={4}
                  {...form.register('actualBehavior')}
                />
                {form.formState.errors.actualBehavior && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.actualBehavior.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email (only for anonymous users) */}
            {!isLoggedIn && (
              <div className="space-y-2">
                <Label htmlFor="email">{t('bugs:form.email.label')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('bugs:form.email.placeholder')}
                  {...form.register('email')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('bugs:form.email.description')}
                </p>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            )}

            {/* Auto-captured info notice */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
              <p className="font-medium mb-1">
                {t('bugs:form.autocapture.title')}
              </p>
              <p>• {t('bugs:form.autocapture.url')}</p>
              <p>• {t('bugs:form.autocapture.browser')}</p>
              {isLoggedIn && <p>• {t('bugs:form.autocapture.user')}</p>}
            </div>

            {/* Submit Button */}
          </form>
        </div>

        <div className="p-6 pt-2 border-t mt-auto shrink-0 bg-background">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              form="bug-report-form"
              disabled={submitMutation.isPending || localSubmitting}
              variant="destructive"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('bugs:form.submit.loading')}
                </>
              ) : (
                <>
                  <Bug className="h-4 w-4 mr-2" />
                  {t('bugs:form.submit.button')}
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
