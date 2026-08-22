'use client';

import { Bug, Github, Linkedin, Youtube } from 'lucide-react';
import { BugReportDialog } from '@/components/bug-report-dialog';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

const externalLinkClass =
  'inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary';

export function Footer() {
  const { t } = useTranslation(['common', 'legal']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const localizedParams = localeParams(locale);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)] lg:gap-12">
          <div className="max-w-sm">
            <Link
              to={LocaleRoutes.home}
              params={localizedParams}
              className="inline-flex min-h-11 items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary focus-visible:text-primary"
            >
              <img src="/logo-light.svg" alt="" className="h-7 w-7 dark:hidden" />
              <img src="/logo-dark.svg" alt="" className="hidden h-7 w-7 dark:block" />
              <span>TestingWithEkki</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {t('common:footer.tagline')}
            </p>
          </div>

          <nav aria-label={t('common:footer.explore')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('common:footer.explore')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.tutorials}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('common:navigation.learn')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.challenges}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('common:navigation.practice')}
                </Link>
              </li>
              <li>
                <span className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground/80">
                  {t('common:navigation.labs')}
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary/80">
                    {t('common:navigation.labsSoon')}
                  </span>
                </span>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.about}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('common:navigation.about')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.connect')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('common:footer.connect')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.contact}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('legal:contact.title')}
                </Link>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/ekkisyamsugiardi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  <Linkedin className="h-4 w-4" aria-hidden="true" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/mihaamiharu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@TestingWithEkki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={externalLinkClass}
                >
                  <Youtube className="h-4 w-4" aria-hidden="true" />
                  YouTube
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.legal')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('common:footer.legal')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.privacy}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('legal:privacy.title')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.terms}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  {t('legal:terms.title')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('common:footer.copyright')}
            <span aria-hidden="true"> · </span>
            {t('common:footer.builtBy')}
          </p>
          <BugReportDialog
            trigger={
              <button className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-destructive focus-visible:text-destructive sm:self-auto">
                <Bug className="h-4 w-4" aria-hidden="true" />
                {t('common:footer.reportBug')}
              </button>
            }
          />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
