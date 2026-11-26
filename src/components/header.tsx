'use client';

import { Link, useLocation, useParams } from '@tanstack/react-router';
import { type AuthSession } from '@/server/auth.fn';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, memo } from 'react';
import {
  ArrowRight,
  Bug,
  LogOut,
  Menu,
  User,
  Trophy,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { signOut } from '@/lib/auth.client';
import { BugReportDialog } from '@/components/bug-report-dialog';
import { LanguageSwitcher } from '@/components/language-switcher';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function HeaderComponent({ session }: { session: AuthSession | null }) {
  const user = session?.user;
  const isAuthenticated = !!user;
  const isAdmin = (user as { role?: string })?.role === 'ADMIN';

  const { t } = useTranslation(['common', 'bugs', 'legal']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const isHomeHero = /^\/(en|id)\/?$/.test(location.pathname);
  const isOverDarkHero = isHomeHero && !scrolled;
  const isAuthPage =
    location.pathname.includes('/login') ||
    location.pathname.includes('/register');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    {
      to: LocaleRoutes.learn,
      params: localeParams(locale),
      label: t('common:navigation.learn'),
    },
    {
      to: LocaleRoutes.practice,
      params: localeParams(locale),
      label: t('common:navigation.practice'),
    },
    {
      to: LocaleRoutes.labs,
      params: localeParams(locale),
      label: t('common:navigation.labs'),
    },
    {
      to: LocaleRoutes.about,
      params: localeParams(locale),
      label: t('common:navigation.about'),
    },
  ];

  const primaryCta = {
    to: LocaleRoutes.learn,
    params: localeParams(locale),
  };
  const showPrimaryCta = isAuthenticated || !isAuthPage;

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = `/${locale}/`;
          },
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const desktopLinkBase = cn(
    'relative flex min-h-11 items-center text-[0.875rem] font-medium transition-[color] duration-200 after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--brand-orange)] after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2',
    isOverDarkHero
      ? 'text-[#cfcdc4] hover:text-white focus-visible:text-white focus-visible:ring-offset-[#111312]'
      : 'text-[var(--muted-graphite)] hover:text-[var(--graphite)] focus-visible:text-[var(--graphite)] focus-visible:ring-offset-[var(--paper-surface)]',
  );

  const desktopLinkActive = cn(
    'relative flex min-h-11 items-center text-[0.875rem] font-semibold transition-[color] duration-200 after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-100 after:bg-[var(--brand-orange)] after:transition-transform after:duration-200 after:ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2',
    isOverDarkHero
      ? 'text-white focus-visible:ring-offset-[#111312]'
      : 'text-[var(--graphite)] focus-visible:ring-offset-[var(--paper-surface)]',
  );

  return (
    <>
      <header
        data-shell="header"
        data-header-surface={isOverDarkHero ? 'transparent' : 'solid'}
        className={cn(
          'sticky top-0 z-40 w-full border-b transition-[background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOverDarkHero
            ? 'border-transparent bg-transparent text-[#f4f3ee]'
            : scrolled
              ? 'border-[var(--soft-border)] bg-[var(--paper-surface)]/95 text-[var(--graphite)] backdrop-blur-md'
              : 'border-[var(--soft-border)]/70 bg-[var(--paper-surface)] text-[var(--graphite)]',
        )}
        style={{
          paddingRight: 'var(--removed-body-scroll-bar-size, 0px)',
        }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex h-[4.5rem] items-center justify-between gap-6">
            {/* Wordmark + single-line desktop nav */}
            <div className="flex items-center gap-10">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                className="group inline-flex min-h-11 shrink-0 items-center"
              >
                <span
                  className={cn(
                    'text-[1.375rem] font-bold tracking-[-0.045em] transition-[color] duration-200',
                    isOverDarkHero
                      ? 'text-[#fbf9f4] group-hover:text-white'
                      : 'text-[var(--graphite)] group-hover:text-[var(--brand-orange-text)]',
                  )}
                >
                  TestingWith
                  <span
                    className={cn(
                      'twe-wordmark-ekki',
                      isOverDarkHero
                        ? 'text-[#ff8862]'
                        : 'text-[var(--brand-orange-text)]',
                    )}
                  >
                    Ekki
                  </span>
                </span>
              </Link>

              <nav
                aria-label="Primary"
                className="hidden items-center gap-7 lg:flex"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className={desktopLinkBase}
                    activeProps={{
                      className: desktopLinkActive,
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right controls */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden items-center sm:flex">
                <LanguageSwitcher tone={isOverDarkHero ? 'dark' : 'light'} />
              </div>

              {isAuthenticated && user ? (
                <UserMenu user={user} locale={locale} />
              ) : (
                !isAuthPage && (
                  <div className="hidden items-center gap-4 lg:flex">
                    <Link
                      to={LocaleRoutes.login}
                      params={localeParams(locale)}
                      className={cn(
                        'inline-flex min-h-11 items-center text-[0.875rem] font-medium transition-[color] duration-200',
                        isOverDarkHero
                          ? 'text-[#e7e5dd] hover:text-white focus-visible:text-white'
                          : 'text-[var(--graphite)] hover:text-[var(--brand-orange-text)] focus-visible:text-[var(--brand-orange-text)]',
                      )}
                    >
                      {t('common:actions.signIn')}
                    </Link>
                    <Button
                      size="sm"
                      asChild
                      className={cn(
                        'h-10 rounded-lg px-4 text-[0.875rem] font-medium shadow-none transition-[background-color,color] duration-200',
                        isOverDarkHero
                          ? 'bg-[#fbf9f4] text-[#141615] hover:bg-[#e8e3d9]'
                          : 'bg-[var(--brand-orange-deep)] text-[var(--paper-surface)] hover:bg-[#993617]',
                      )}
                    >
                      <Link to={primaryCta.to} params={primaryCta.params}>
                        {t('common:actions.startWebAutomation')}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                )
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'lg:hidden',
                  isOverDarkHero
                    ? 'text-[#fbf9f4] hover:bg-white/10 hover:text-white'
                    : 'text-[var(--graphite)]',
                )}
                type="button"
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={
                  isMobileMenuOpen
                    ? t('common:actions.closeMenu')
                    : t('common:actions.openMenu')
                }
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[var(--graphite)]/25"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="relative flex h-full w-full max-w-[22rem] flex-col border-r border-[var(--soft-border)] bg-[var(--paper-surface)] px-5 py-5 animate-in fade-in-0 slide-in-from-left duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none motion-reduce:opacity-100"
          >
            <div className="mb-7 flex items-center justify-between">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="group inline-flex min-h-11 items-center"
              >
                <span className="text-[1.25rem] font-bold tracking-[-0.045em] text-[var(--graphite)] group-hover:text-[var(--brand-orange-text)]">
                  TestingWith
                  <span className="twe-wordmark-ekki text-[var(--brand-orange-text)]">
                    Ekki
                  </span>
                </span>
              </Link>
              <Button
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('common:actions.closeMenu')}
                className="rounded-md text-[var(--graphite)] hover:bg-[var(--orange-tint)]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex min-h-12 items-center border-b border-transparent px-1 text-[1.0625rem] font-medium text-[var(--graphite)] transition-[color,border-color] duration-200 hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange-text)] focus-visible:text-[var(--brand-orange-text)]"
                    activeProps={{
                      className:
                        'flex min-h-12 items-center border-b-2 border-[var(--brand-orange)] px-1 text-[1.0625rem] font-semibold text-[var(--graphite)]',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="my-5 border-t border-[var(--soft-border)]" />

              <Link
                to={LocaleRoutes.contact}
                params={localeParams(locale)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-12 items-center px-1 text-[1.0625rem] font-medium text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)] focus-visible:text-[var(--brand-orange-text)]"
              >
                {t('legal:contact.title')}
              </Link>

              <div className="my-5 border-t border-[var(--soft-border)]" />

              <div className="space-y-0.5">
                <div className="flex min-h-12 items-center px-1">
                  <LanguageSwitcher />
                </div>

                {isAuthenticated && user ? (
                  <>
                    <Link
                      to={LocaleRoutes.profile}
                      params={localeParams(locale)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)]"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      {t('common:navigation.profile')}
                    </Link>
                    <Link
                      to={LocaleRoutes.leaderboard}
                      params={localeParams(locale)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)]"
                    >
                      <Trophy className="h-4 w-4" aria-hidden="true" />
                      {t('common:navigation.leaderboard')}
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)]"
                      >
                        <LayoutDashboard
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {t('common:navigation.admin')}
                      </Link>
                    )}
                    <div className="flex min-h-12 items-center px-1">
                      <BugReportDialog
                        trigger={
                          <button className="inline-flex items-center gap-3 text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)]">
                            <Bug className="h-4 w-4" aria-hidden="true" />
                            {t('bugs:dialog.trigger')}
                          </button>
                        }
                      />
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        void handleSignOut();
                      }}
                      className="flex min-h-12 w-full items-center gap-3 px-1 text-left text-[var(--brand-error)] transition-[color] duration-200 hover:text-[var(--brand-error)]/80"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      {t('common:navigation.logout')}
                    </button>
                  </>
                ) : (
                  !isAuthPage && (
                    <Link
                      to={LocaleRoutes.login}
                      params={localeParams(locale)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 px-1 text-[1.0625rem] font-medium text-[var(--graphite)] transition-[color] duration-200 hover:text-[var(--brand-orange-text)]"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      {t('common:actions.signIn')}
                    </Link>
                  )
                )}
              </div>
            </div>

            {showPrimaryCta && (
              <div className="mt-5 border-t border-[var(--soft-border)] pt-5">
                <Button
                  asChild
                  className="h-12 w-full rounded-lg bg-[var(--brand-orange-deep)] text-[1.0625rem] font-medium text-[var(--paper-surface)] shadow-none hover:bg-[#993617]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to={primaryCta.to} params={primaryCta.params}>
                    {t(
                      isAuthenticated
                        ? 'common:actions.startLearning'
                        : 'common:actions.startWebAutomation',
                    )}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

export const Header = memo(HeaderComponent, areHeaderPropsEqual);

function areHeaderPropsEqual(
  prev: { session: AuthSession | null },
  next: { session: AuthSession | null },
) {
  if (!!prev.session !== !!next.session) return false;
  if (!prev.session && !next.session) return true;

  return (
    prev.session?.user?.id === next.session?.user?.id &&
    prev.session?.user?.name === next.session?.user?.name &&
    prev.session?.user?.image === next.session?.user?.image &&
    prev.session?.user?.email === next.session?.user?.email &&
    prev.session?.user?.role === next.session?.user?.role
  );
}

export default Header;
