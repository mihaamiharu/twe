import { createFileRoute, Link, getRouteApi } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { z } from 'zod';
import { confirmSubscription } from '@/server/newsletter.fn';
import { Button } from '@/components/ui/button';
import {
  CTAButton,
  PageContainer,
  PaperSurface,
  StatePanel,
} from '@/components/cozy-quest';
import { createSeoHead } from '@/lib/seo';

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute('/$locale/confirm-subscription')({
  validateSearch: searchSchema,
  component: ConfirmSubscriptionPage,
  head: ({ params }) =>
    createSeoHead({
      title: 'Confirm Subscription | TestingWithEkki',
      description: 'Confirm your newsletter subscription for TestingWithEkki.',
      path: '/confirm-subscription',
      locale: params.locale || 'en',
      noIndex: true,
    }),
});

const routeApi = getRouteApi('/$locale/confirm-subscription');

function ConfirmSubscriptionPage() {
  const { token } = routeApi.useSearch();
  const { locale } = routeApi.useParams();
  const { t } = useTranslation(['legal', 'common']);
  const { data, isLoading, error } = useQuery({
    queryKey: ['confirm-subscription', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const result = await confirmSubscription({ data: { token } });
      if (!result.success)
        throw new Error(result.error || 'Failed to confirm subscription');
      return result;
    },
    enabled: Boolean(token),
    retry: false,
  });

  const state = !token
    ? 'invalid'
    : isLoading
      ? 'loading'
      : error
        ? 'error'
        : data
          ? 'success'
          : 'loading';
  const content = (() => {
    switch (state) {
      case 'invalid':
        return {
          icon: XCircle,
          tone: 'danger' as const,
          title: t('subscription.invalidTitle'),
          description: t('subscription.invalidDescription'),
        };
      case 'error':
        return {
          icon: XCircle,
          tone: 'danger' as const,
          title: t('subscription.errorTitle'),
          description: error?.message || t('subscription.errorDescription'),
        };
      case 'success':
        return {
          icon: CheckCircle2,
          tone: 'success' as const,
          title: t('subscription.successTitle'),
          description: t('subscription.successDescription'),
        };
      default:
        return {
          icon: Loader2,
          tone: 'neutral' as const,
          title: t('subscription.loadingTitle'),
          description: t('subscription.loadingDescription'),
        };
    }
  })();

  return (
    <main className="min-h-[calc(100vh-4.5rem)] py-12 sm:py-20">
      <PageContainer width="narrow">
        <PaperSurface className="px-6 py-14 sm:px-10" texture>
          <StatePanel
            icon={content.icon}
            tone={content.tone}
            busy={state === 'loading'}
            title={content.title}
            description={content.description}
            actions={
              state !== 'loading' &&
              (state === 'success' ? (
                <CTAButton asChild>
                  <Link to="/$locale/tutorials" params={{ locale }}>
                    {t('subscription.successAction')}
                  </Link>
                </CTAButton>
              ) : (
                <Button asChild>
                  <Link to="/$locale" params={{ locale }}>
                    {t('common:actions.goHome')}
                  </Link>
                </Button>
              ))
            }
          />
        </PaperSurface>
      </PageContainer>
    </main>
  );
}
