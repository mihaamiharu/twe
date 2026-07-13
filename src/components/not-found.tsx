import { Link, useParams } from '@tanstack/react-router';
import { MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CTAButton,
  PageContainer,
  PaperSurface,
  StatePanel,
} from '@/components/cozy-quest';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const { t } = useTranslation('common');
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';

  return (
    <main className="min-h-[calc(100vh-4.5rem)] py-12 sm:py-20">
      <PageContainer width="narrow">
        <PaperSurface
          className="relative overflow-hidden px-6 py-14 sm:px-10"
          texture
        >
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-12 size-44 rounded-full border-[16px] border-accent/30"
          />
          <StatePanel
            icon={MapPinOff}
            title={t('notFound.title')}
            description={t('notFound.description')}
            actions={
              <>
                <CTAButton asChild>
                  <Link to="/$locale" params={{ locale }}>
                    {t('actions.goHome')}
                  </Link>
                </CTAButton>
                <Button variant="outline" asChild>
                  <Link to="/$locale/tutorials" params={{ locale }}>
                    {t('actions.browseFieldGuide')}
                  </Link>
                </Button>
              </>
            }
          />
          <p className="relative mt-8 text-center font-mono-tech text-xs text-muted-foreground">
            {t('notFound.tip')}
          </p>
        </PaperSurface>
      </PageContainer>
    </main>
  );
}
