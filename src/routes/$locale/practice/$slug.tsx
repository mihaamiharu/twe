import {
  createFileRoute,
  useParams,
  useNavigate,
  Link,
  notFound,
  rootRouteId,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useCallback, useMemo } from 'react';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  challengeCatalogQueryKeys,
  challengeDetailQueryOptions,
} from '@/lib/challenges.query';
import { ChallengeSkeleton } from '@/components/challenges/challenge-skeleton';
import { ChallengeSuccessDialog } from '@/components/challenges/challenge-success-dialog';
import { deobfuscate } from '@/lib/obfuscator';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { type TestResult } from '@/components/challenges/test-results';
import { createSubmission } from '@/server/submissions.fn';
import { authQueryOptions } from '@/lib/auth.query';
import { trackEvent } from '@/lib/analytics';
import { AuthGuardDialog } from '@/components/auth/auth-guard-dialog';
import { showAchievementToasts } from '@/components/achievement-toast';
import { getLevelTitle } from '@/lib/gamification';
import { transformChallengeResponse } from '@/lib/transform-challenge-response';
import {
  buildChallengeSubmissionPayload,
  type ChallengeSubmissionPayload,
} from '@/lib/challenge-submission';
import { omitUndefined } from '@/lib/omit-undefined';
import { createPracticeDetailSeoHead } from '@/lib/practice-seo';

const ChallengePlayground = lazy(async () => {
  const module = await import('@/components/challenges/challenge-playground');
  return { default: module.ChallengePlayground };
});

export const Route = createFileRoute('/$locale/practice/$slug')({
  loader: async ({ context, params }) => {
    const auth = await context.queryClient.ensureQueryData(authQueryOptions);
    const response = await context.queryClient.ensureQueryData(
      challengeDetailQueryOptions(params.slug, params.locale, auth.user?.id),
    );

    if (!response.success) {
      // TanStack Router's notFound sentinel is the established route-level
      // fallback, even though it is not typed as a native Error instance.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound({ routeId: rootRouteId });
    }
    return response;
  },
  component: ChallengeDetailPage,
  head: ({ loaderData, params }) => {
    const locale = params.locale || 'en';
    return createPracticeDetailSeoHead({
      locale,
      slug: params.slug,
      challenge: loaderData?.success ? loaderData.data : null,
    });
  },
  pendingComponent: ChallengeSkeleton,
});

function ChallengeDetailPage() {
  const { locale, slug } = useParams({ from: '/$locale/practice/$slug' });
  const { t } = useTranslation(['challenges', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    xpEarned: number;
    achievements: { id: string; name: string; icon: string }[];
    levelUp?: { newLevel: number; title: string };
  } | null>(null);

  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const userId = auth.user?.id;

  const { data: challengeResponse } = useSuspenseQuery(
    challengeDetailQueryOptions(slug, locale, auth.user?.id),
  );
  const challengeData = challengeResponse?.success
    ? challengeResponse.data
    : null;

  // Deobfuscate inputs if needed (for selector challenges)
  const testCases = useMemo(() => {
    if (!challengeData?.testCases) return [];
    return challengeData.testCases.map((tc) => {
      const input = tc.input as { selector?: string; xpath?: string };
      const processedInput = { ...input };

      if (processedInput.selector) {
        processedInput.selector = deobfuscate(processedInput.selector);
      }
      if (processedInput.xpath) {
        processedInput.xpath = deobfuscate(processedInput.xpath);
      }

      return {
        ...tc,
        input: processedInput,
      };
    });
  }, [challengeData?.testCases]);

  // Transform API response to Challenge type expected by ChallengePlayground
  const challenge = transformChallengeResponse(challengeData, testCases);

  const submitMutation = useMutation({
    mutationFn: async (submissionData: ChallengeSubmissionPayload) => {
      const response = await createSubmission({ data: submissionData });

      if (!response.success) {
        throw new Error(response.error || 'Failed to submit solution');
      }

      return response;
    },
    onSuccess: async (response) => {
      if (response.success && response.data?.submission?.isPassed) {
        // Practice mode: show simple toast, skip success dialog
        if (response.data.isPracticeMode) {
          toast.success(t('challenges:practice.complete'));
          return;
        }

        setLastSubmissionResult({
          xpEarned: response.data.submission.xpEarned,
          achievements: response.data.newAchievements || [],
          ...omitUndefined({
            levelUp: response.data.levelUp
              ? {
                  newLevel: response.data.levelUp.newLevel,
                  title: getLevelTitle(response.data.levelUp.newLevel),
                }
              : undefined,
          }),
        });
        setShowSuccessDialog(true);

        toast.success(t('common:messages.challengeCompleted'), {
          description: response.data.newAchievements?.length
            ? t('common:messages.achievementUnlocked', {
                name: response.data.newAchievements[0]?.name,
              })
            : undefined,
        });

        // Track analytics events
        if (challengeData) {
          trackEvent('challenge_completed', {
            slug: challengeData.slug,
            difficulty: challengeData.difficulty,
            xp: response.data.submission.xpEarned,
          });
        }

        // Track level-up if it occurred
        if (response.data.levelUp) {
          trackEvent('level_up', {
            newLevel: response.data.levelUp.newLevel,
            totalXP: response.data.submission.xpEarned, // Note: This is XP earned, not total
          });
        }

        // Track new achievements
        if (response.data.newAchievements?.length) {
          for (const achievement of response.data.newAchievements) {
            trackEvent('achievement_unlocked', {
              slug: achievement.id,
              name: achievement.name,
            });
          }
          // Show toast notifications for new achievements
          showAchievementToasts(response.data.newAchievements);
        }

        // Invalidate queries to refresh progress
        await queryClient.invalidateQueries({
          queryKey: challengeCatalogQueryKeys.detail(
            slug,
            locale,
            auth.user?.id,
          ),
        });
        await queryClient.invalidateQueries({
          queryKey: challengeCatalogQueryKeys.list(locale, auth.user?.id),
        });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = useCallback(
    (data: {
      code: string;
      passed: boolean;
      testResults: TestResult[];
      executionTime?: number;
    }) => {
      if (!challenge) return;

      // Auth Guard: Check if user is logged in
      if (!userId) {
        setShowAuthGuard(true);
        return;
      }

      if (!data.passed) {
        toast.error(t('challenges:toasts.notPassed'));
        return;
      }

      const submissionData = buildChallengeSubmissionPayload({
        challengeSlug: challenge.slug,
        code: data.code,
        isPractice: challenge.isCompleted, // Auto-detect practice mode
        testResults: data.testResults,
        ...omitUndefined({ executionTime: data.executionTime }),
        locale,
      });

      toast.promise(submitMutation.mutateAsync(submissionData), {
        loading: t('common:messages.submitting'),
        success: t('challenges:toasts.submittedSuccess'),
        error: t('challenges:toasts.submittedFailed'),
      });
    },
    [challenge, submitMutation, userId, locale, t],
  );

  if (!challenge) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold mb-4">
                {t('challenges:page.notFound')}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t('challenges:page.notFoundDescription')}
              </p>
              <div className="flex items-center gap-4 mb-6 justify-center">
                <Link to="/$locale/practice" params={{ locale }}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common:actions.backToChallenges')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] min-w-0 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <Suspense fallback={<ChallengeSkeleton />}>
          <ChallengePlayground
            key={challenge.id}
            challenge={challenge}
            onSubmit={handleSubmit}
            {...omitUndefined({ userId })}
            hintUsed={challengeData?.userProgress?.usedHint || false}
            initialHintContent={
              challengeData?.userProgress?.hintContent || null
            }
          />
        </Suspense>
      </div>

      {lastSubmissionResult && (
        <ChallengeSuccessDialog
          isBoss={challenge.slug.includes('boss')}
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          xpEarned={lastSubmissionResult.xpEarned}
          achievements={lastSubmissionResult.achievements}
          {...omitUndefined({ levelUp: lastSubmissionResult.levelUp })}
          onRetry={() => setShowSuccessDialog(false)}
          {...omitUndefined({
            onNextChallenge: challengeData?.nextChallenge
              ? () => {
                  setShowSuccessDialog(false);
                  void navigate({
                    to: '/$locale/practice/$slug',
                    params: {
                      locale,
                      slug: challengeData.nextChallenge?.slug ?? '',
                    },
                  });
                }
              : undefined,
          })}
        />
      )}

      <AuthGuardDialog
        open={showAuthGuard}
        onOpenChange={setShowAuthGuard}
        title={t('auth:guard.title')}
        description={t('auth:guard.description')}
      />
    </div>
  );
}
