import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import {
  PageContainer,
  PaperSurface,
  StatePanel,
} from '@/components/cozy-quest';
import { Button } from '@/components/ui/button';

export function DefaultErrorComponent({ error }: { error: Error }) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();
  const { t } = useTranslation('common');

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="min-h-[80vh] py-12 sm:py-20">
      <PageContainer width="narrow">
        <PaperSurface
          className="border-destructive/30 px-6 py-14 sm:px-10"
          texture={false}
        >
          <StatePanel
            icon={AlertCircle}
            tone="danger"
            title={t('states.errorTitle')}
            description={t('states.errorDescription')}
            details={
              <details className="rounded-xl border border-border bg-background/70 p-3 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  {t('states.errorDetails')}
                </summary>
                <p className="mt-3 max-h-32 overflow-auto font-mono-tech text-xs leading-5 text-muted-foreground">
                  {error.message || 'Unknown error'}
                </p>
              </details>
            }
            actions={
              <>
                <Button variant="outline" onClick={() => router.history.go(-1)}>
                  {t('actions.back')}
                </Button>
                <Button
                  onClick={() => {
                    queryErrorResetBoundary.reset();
                    void router
                      .invalidate()
                      .finally(() => window.location.reload());
                  }}
                >
                  <RefreshCcw className="size-4" aria-hidden="true" />
                  {t('actions.tryAgain')}
                </Button>
              </>
            }
          />
        </PaperSurface>
      </PageContainer>
    </main>
  );
}
