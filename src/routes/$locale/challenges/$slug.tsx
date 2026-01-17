import {
  createFileRoute,
  useParams,
  useNavigate,
  Link,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { challengeDetailQueryOptions } from '@/lib/challenges.query';
import { ChallengePlayground, type Challenge, ChallengeSkeleton } from '@/components/challenges';
import { ChallengeSuccessDialog } from '@/components/challenges/ChallengeSuccessDialog';
import { deobfuscate } from '@/lib/obfuscator';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import { type TestResult } from '@/components/challenges/TestResults';
import { createSubmission } from '@/server/submissions.fn';
import { authQueryOptions } from '@/lib/auth.query';
import { trackEvent } from '@/lib/analytics';
import { AuthGuardDialog } from '@/components/auth/AuthGuardDialog';
import { showAchievementToasts } from '@/components/achievement-toast';
import { getLevelTitle } from '@/lib/gamification';

import i18n from '@/lib/i18n';

interface ServerChallengeResponse {
  success: boolean;
  data?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    instructions: string;
    type: 'JAVASCRIPT' | 'PLAYWRIGHT' | 'CSS_SELECTOR' | 'XPATH_SELECTOR' | 'SELECTOR';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
    xpReward: number;
    order: number;
    htmlContent?: string;
    files?: Record<string, { code: string; active?: boolean; hidden?: boolean }>;
    starterCode?: string;
    tags?: string[];
    completionCount: number;
    tutorial?: { slug: string; title: string } | null;
    testCases: {
      id: string;
      description: string;
      input: unknown;
      expectedOutput: unknown;
      isHidden?: boolean;
    }[];
    hiddenTestCaseCount: number;
    userProgress?: {
      isCompleted: boolean;
      attempts: number;
      lastAccessedAt: Date;
      usedHint: boolean;
    } | null;
    bestSubmission?: {
      code: string;
      isPassed: boolean;
      xpEarned: number;
      testsPassed: number;
      testsTotal: number;
      executionTime: number;
    } | null;
    nextChallenge?: { slug: string; title: string } | null;
    prevChallenge?: { slug: string; title: string } | null;
  };
  error?: string;
}

export const Route = createFileRoute('/$locale/challenges/$slug')({
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      challengeDetailQueryOptions(params.slug, params.locale),
    );
  },
  component: ChallengeDetailPage,
  head: ({ loaderData }: { loaderData: ServerChallengeResponse }) => {
    const data = loaderData?.data;
    if (!data) {
      return {
        meta: [
          { title: i18n.t('challenges:page.seo.title') },
          { name: 'description', content: i18n.t('challenges:page.seo.description') },
        ],
      };
    }

    const title = `${data.title} (${data.difficulty === 'EASY' ? i18n.t('common:labels.easy') : data.difficulty === 'MEDIUM' ? i18n.t('common:labels.medium') : i18n.t('common:labels.hard')}) | TestingWithEkki`;

    return {
      meta: [
        { title },
        { name: 'description', content: data.description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: data.description },
      ],
      links: [
        {
          rel: 'canonical',
          href: `https://testingwithekki.com/en/challenges/${data.slug}`,
        },
      ],
    };
  },
  pendingComponent: ChallengeSkeleton,
});





function ChallengeDetailPage() {
  const { locale, slug } = useParams({ from: '/$locale/challenges/$slug' });
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

  const {
    data: challengeData,
  } = useSuspenseQuery(challengeDetailQueryOptions(slug, locale));

  // Rename for compatibility with existing code
  // Rename for compatibility with existing code
  const data = challengeData as ServerChallengeResponse;




  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const sessionData = auth; // Alias for compatibility
  const userId = sessionData?.user?.id;

  // Deobfuscate inputs if needed (for selector challenges)
  const testCases = useMemo(() => {
    if (!data?.data?.testCases) return [];
    return data.data.testCases.map((tc) => {
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
  }, [data?.data?.testCases]);

  // Transform API response to Challenge type expected by ChallengePlayground
  const challenge: Challenge | null =
    data && data.success && data.data
      ? {
        id: data.data.id,
        slug: data.data.slug,
        title: data.data.title,
        description: data.data.description,
        type: data.data.type,
        difficulty:
          data.data.difficulty === 'EASY'
            ? 'Easy'
            : data.data.difficulty === 'MEDIUM'
              ? 'Medium'
              : 'Hard',
        xp: data.data.xpReward,
        instructions: data.data.instructions,
        htmlContent: data.data.htmlContent || '',
        files: data.data.files,
        starterCode: data.data.starterCode || '',
        targetSelector: (() => {
          if (!testCases.length) return '';

          // Try to find selector in the first test case input
          const firstTestInput = testCases[0].input as {
            selector?: string;
            xpath?: string;
          };
          return firstTestInput?.selector || firstTestInput?.xpath || '';
        })(),

        testCases: testCases.map((tc) => ({
          id: tc.id,
          name: tc.description,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
        category: data.data.category,
        isCompleted: data.data.userProgress?.isCompleted || false,
        tutorial: data.data.tutorial,
        nextChallenge: data.data.nextChallenge,
        prevChallenge: data.data.prevChallenge,
      }
      : null;

  const submitMutation = useMutation({
    mutationFn: async (submissionData: {
      challengeSlug: string;
      code: string;
      isPractice?: boolean;
      testResults: {
        testCaseId?: string;
        passed: boolean;
        output?: unknown;
        error?: string;
      }[];
      executionTime?: number;
    }) => {
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
          levelUp: response.data.levelUp
            ? {
              newLevel: response.data.levelUp.newLevel,
              title: getLevelTitle(response.data.levelUp.newLevel),
            }
            : undefined,
        });
        setShowSuccessDialog(true);

        toast.success(t('common:messages.challengeCompleted'), {
          description: response.data.newAchievements?.length
            ? t('common:messages.achievementUnlocked', {
              name: response.data.newAchievements[0].name,
            })
            : undefined,
        });

        // Track analytics events
        if (data?.data) {
          trackEvent('challenge_completed', {
            slug: data.data.slug,
            difficulty: data.data.difficulty,
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
        await queryClient.invalidateQueries({ queryKey: ['challenge', slug] });
        await queryClient.invalidateQueries({ queryKey: ['challenges'] }); // Refresh challenges list
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
      if (!sessionData?.user) {
        setShowAuthGuard(true);
        return;
      }

      if (!data.passed) {
        toast.error(t('challenges:toasts.notPassed'));
        return;
      }

      const submissionData = {
        challengeSlug: challenge.slug,
        code: data.code,
        isPractice: challenge.isCompleted, // Auto-detect practice mode
        testResults: data.testResults.map((tr) => ({
          testCaseId:
            tr.id !== 'main' && tr.id !== 'selector' ? tr.id : undefined,
          passed: tr.passed,
          output: tr.output,
          error: tr.error,
        })),
        executionTime: data.executionTime,
        locale,
      };

      toast.promise(submitMutation.mutateAsync(submissionData), {
        loading: t('common:messages.submitting'),
        success: t('challenges:toasts.submittedSuccess'),
        error: t('challenges:toasts.submittedFailed'),
      });
    },
    [challenge, submitMutation, sessionData, locale, t],
  );


  if (!challenge) {
    return (
      <div className="min-h-screen p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold mb-4">
                {t('challenges:page.notFound')}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t('challenges:page.notFoundDescription')}
              </p>
              <div className="flex items-center gap-4 mb-6 justify-center">
                <Link to="/$locale/challenges" params={{ locale }}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common:actions.backToChallenges')}
                  </Button>
                </Link>
                {data?.data?.tutorial && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <Link
                      to="/$locale/tutorials/$slug"
                      params={{ locale, slug: data.data.tutorial.slug }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t('challenges:page.reviewTutorial', {
                          title: data.data.tutorial.title,
                        })}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 min-h-0">
        <ChallengePlayground
          challenge={challenge}
          onSubmit={handleSubmit}
          userId={userId}
          hintUsed={data?.data?.userProgress?.usedHint || false}
        />
      </div>

      {lastSubmissionResult && (
        <ChallengeSuccessDialog
          isBoss={challenge.slug.includes('boss')}
          open={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          xpEarned={lastSubmissionResult.xpEarned}
          achievements={lastSubmissionResult.achievements}
          levelUp={lastSubmissionResult.levelUp}
          onRetry={() => setShowSuccessDialog(false)}
          onNextChallenge={
            data?.data?.nextChallenge
              ? () => {
                setShowSuccessDialog(false);
                void navigate({
                  to: '/$locale/challenges/$slug',
                  params: { locale, slug: data.data.nextChallenge!.slug },
                });
              }
              : undefined
          }
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
