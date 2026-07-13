import type { ReactNode } from 'react';
import { BookOpenCheck, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageContainer, PaperSurface } from '@/components/cozy-quest';

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: AuthPageShellProps) {
  const { t } = useTranslation('auth');
  return (
    <main className="min-h-[calc(100vh-4.5rem)] py-8 sm:py-12 lg:flex lg:items-center">
      <PageContainer width="wide">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_minmax(22rem,0.7fr)] lg:items-center">
          <PaperSurface
            className="relative overflow-hidden p-7 sm:p-10"
            texture
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 size-48 rounded-full border-[18px] border-accent/35"
            />
            <div className="relative">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
              <div className="mt-8 hidden items-center gap-3 text-sm text-muted-foreground lg:flex">
                <BookOpenCheck
                  className="size-5 text-primary"
                  aria-hidden="true"
                />
                <span>{t('journey.note')}</span>
              </div>
            </div>
          </PaperSurface>
          <div className="w-full">{children}</div>
        </div>
      </PageContainer>
    </main>
  );
}
