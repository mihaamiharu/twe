'use client';

import {
  BookOpen,
  Bug,
  FileText,
  FlaskConical,
  Github,
  Linkedin,
  Mail,
  ShieldCheck,
  Target,
  UserRound,
  Youtube,
} from 'lucide-react';
import { BugReportDialog } from '@/components/bug-report-dialog';
import { QaDoodle } from '@/components/qa-illustrations';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

const externalLinkClass =
  'group inline-flex min-h-11 items-center gap-3 text-[0.95rem] font-medium text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)]';

const iconClass =
  'h-[1.1rem] w-[1.1rem] shrink-0 text-[var(--muted-graphite)] transition-colors group-hover:text-[var(--brand-orange)]';

export function Footer() {
  const { t } = useTranslation(['common', 'legal']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const localizedParams = localeParams(locale);

  return (
    <footer
      data-shell="footer"
      className="border-t border-[var(--soft-border)] bg-[var(--paper-surface)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-11 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] lg:gap-14">
          <div className="max-w-sm">
            <Link
              to={LocaleRoutes.home}
              params={localizedParams}
              className="group inline-flex min-h-11 items-center"
            >
              <span className="text-[1.7rem] font-semibold tracking-[-0.05em] text-[var(--graphite)] group-hover:text-[var(--brand-orange)]">
                TestingWith
                <span className="twe-wordmark-ekki text-[var(--brand-orange)]">
                  Ekki
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-[19rem] text-[1rem] leading-7 text-[var(--muted-graphite)]">
              {t('common:footer.tagline')}
            </p>
            <QaDoodle kind="trace" className="mt-7 h-11 w-11" />
          </div>

          <nav aria-label={t('common:footer.explore')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand-orange)]">
              {t('common:footer.explore')}
            </h2>
            <div className="mt-4 h-px w-14 bg-[var(--brand-orange)]" />
            <ul className="mt-3 space-y-0.5">
              <li>
                <Link
                  to={LocaleRoutes.tutorials}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  <BookOpen className={iconClass} aria-hidden="true" />
                  {t('common:navigation.learn')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.challenges}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  <Target className={iconClass} aria-hidden="true" />
                  {t('common:navigation.practice')}
                </Link>
              </li>
              <li>
                <span className="inline-flex min-h-11 items-center gap-3 text-[0.95rem] font-medium text-[var(--muted-graphite)]">
                  <FlaskConical className={iconClass} aria-hidden="true" />
                  {t('common:navigation.labs')}
                  <span className="rounded bg-[var(--orange-tint)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brand-orange)]">
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
                  <UserRound className={iconClass} aria-hidden="true" />
                  {t('common:navigation.about')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.connect')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand-orange)]">
              {t('common:footer.connect')}
            </h2>
            <div className="mt-4 h-px w-14 bg-[var(--brand-orange)]" />
            <ul className="mt-3 space-y-0.5">
              <li>
                <Link
                  to={LocaleRoutes.contact}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  <Mail className={iconClass} aria-hidden="true" />
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
                  <Linkedin className={iconClass} aria-hidden="true" />
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
                  <Github className={iconClass} aria-hidden="true" />
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
                  <Youtube className={iconClass} aria-hidden="true" />
                  YouTube
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.legal')}>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--brand-orange)]">
              {t('common:footer.legal')}
            </h2>
            <div className="mt-4 h-px w-14 bg-[var(--brand-orange)]" />
            <ul className="mt-3 space-y-0.5">
              <li>
                <Link
                  to={LocaleRoutes.privacy}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  <ShieldCheck className={iconClass} aria-hidden="true" />
                  {t('legal:privacy.title')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.terms}
                  params={localizedParams}
                  className={externalLinkClass}
                >
                  <FileText className={iconClass} aria-hidden="true" />
                  {t('legal:terms.title')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--soft-border)] pt-6 text-sm text-[var(--muted-graphite)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('common:footer.copyright')}
            <span aria-hidden="true"> · </span>
            {t('common:footer.builtBy')}
          </p>
          <BugReportDialog
            trigger={
              <button className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-[var(--muted-graphite)] transition-colors hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)] sm:self-auto">
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
