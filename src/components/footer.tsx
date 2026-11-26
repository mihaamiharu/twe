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
import { useTranslation } from 'react-i18next';
import { Link, useParams } from '@tanstack/react-router';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

const footerLinkClass =
  'group inline-flex min-h-10 items-center gap-2.5 text-[0.875rem] font-medium text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)] focus-visible:text-[var(--brand-orange-text)]';

const iconClass =
  'h-4 w-4 shrink-0 text-[var(--muted-graphite)] transition-[color] duration-200 group-hover:text-[var(--brand-orange-text)]';

export function Footer() {
  const { t } = useTranslation(['common', 'legal']);
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const localizedParams = localeParams(locale);
  const copyrightYear = new Date().getFullYear();

  return (
    <footer
      data-shell="footer"
      className="border-t border-[var(--soft-border)] bg-[var(--paper-surface)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_repeat(3,minmax(0,1fr))] lg:gap-14">
          <div className="max-w-sm">
            <Link
              to={LocaleRoutes.home}
              params={localizedParams}
              className="group inline-flex min-h-11 items-center"
            >
              <span className="text-[1.5rem] font-bold tracking-[-0.045em] text-[var(--graphite)] transition-[color] duration-200 group-hover:text-[var(--brand-orange-text)]">
                TestingWith
                <span className="twe-wordmark-ekki text-[var(--brand-orange-text)]">
                  Ekki
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-[1.6] text-[var(--muted-graphite)]">
              {t('common:footer.tagline')}
            </p>
          </div>

          <nav aria-label={t('common:footer.explore')}>
            <h2 className="text-[0.875rem] font-semibold text-[var(--graphite)]">
              {t('common:footer.explore')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.learn}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <BookOpen className={iconClass} aria-hidden="true" />
                  {t('common:navigation.learn')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.practice}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <Target className={iconClass} aria-hidden="true" />
                  {t('common:navigation.practice')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.labs}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <FlaskConical className={iconClass} aria-hidden="true" />
                  {t('common:navigation.labs')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.about}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <UserRound className={iconClass} aria-hidden="true" />
                  {t('common:navigation.about')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.connect')}>
            <h2 className="text-[0.875rem] font-semibold text-[var(--graphite)]">
              {t('common:footer.connect')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.contact}
                  params={localizedParams}
                  className={footerLinkClass}
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
                  className={footerLinkClass}
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
                  className={footerLinkClass}
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
                  className={footerLinkClass}
                >
                  <Youtube className={iconClass} aria-hidden="true" />
                  YouTube
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t('common:footer.legal')}>
            <h2 className="text-[0.875rem] font-semibold text-[var(--graphite)]">
              {t('common:footer.legal')}
            </h2>
            <ul className="mt-4 space-y-1">
              <li>
                <Link
                  to={LocaleRoutes.privacy}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <ShieldCheck className={iconClass} aria-hidden="true" />
                  {t('legal:privacy.title')}
                </Link>
              </li>
              <li>
                <Link
                  to={LocaleRoutes.terms}
                  params={localizedParams}
                  className={footerLinkClass}
                >
                  <FileText className={iconClass} aria-hidden="true" />
                  {t('legal:terms.title')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--soft-border)] pt-6 text-[0.875rem] text-[var(--muted-graphite)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('common:footer.copyright', { year: copyrightYear })}
            <span aria-hidden="true"> · </span>
            {t('common:footer.builtBy')}
          </p>
          <BugReportDialog
            trigger={
              <button className="inline-flex min-h-10 items-center gap-2 self-start text-[0.875rem] text-[var(--muted-graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)] focus-visible:text-[var(--brand-orange-text)] sm:self-auto">
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
