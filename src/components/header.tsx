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
  const isAuthPage =
    location.pathname.includes('/login') ||
    location.pathname.includes('/register');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Public labels intentionally map to the existing route names for now.
  const navLinks = [
    {
      to: LocaleRoutes.tutorials,
      params: localeParams(locale),
      label: t('common:navigation.learn'),
    },
    {
      to: LocaleRoutes.challenges,
      params: localeParams(locale),
      label: t('common:navigation.practice'),
    },
  ];

  const aboutLink = {
    to: LocaleRoutes.about,
    params: localeParams(locale),
    label: t('common:navigation.about'),
  };

  const primaryCta = isAuthenticated
    ? {
        to: LocaleRoutes.tutorials,
        params: localeParams(locale),
      }
    : {
        to: LocaleRoutes.register,
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

  return (
    <>
      <header
        data-shell="header"
        className={cn(
          'sticky top-0 z-40 w-full border-b bg-[var(--paper-surface)] transition-colors duration-200',
          scrolled
            ? 'border-[var(--soft-border)]'
            : 'border-[var(--soft-border)]/70',
        )}
        style={{
          paddingRight: 'var(--removed-body-scroll-bar-size, 0px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-9">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                className="group inline-flex min-h-11 items-center"
              >
                <span className="relative text-[1.2rem] font-semibold tracking-[-0.04em] text-[var(--graphite)] after:absolute after:-bottom-1 after:left-[57%] after:h-[2px] after:w-10 after:-rotate-6 after:bg-[var(--brand-orange)] after:content-[''] group-hover:text-[var(--brand-orange)]">
                  TestingWith
                  <span className="text-[var(--brand-orange)]">Ekki</span>
                </span>
              </Link>

              <nav
                aria-label="Primary"
                className="hidden items-center gap-7 md:flex"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className="relative flex min-h-11 items-center text-[0.9rem] font-medium text-[var(--muted-graphite)] transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-transparent hover:text-[var(--graphite)] focus-visible:text-[var(--graphite)]"
                    activeProps={{
                      className:
                        'relative flex min-h-11 items-center text-[0.9rem] font-semibold text-[var(--graphite)] transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-[var(--brand-orange)]',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <span
                  className="inline-flex min-h-11 items-center gap-2 text-[0.9rem] font-medium text-[var(--muted-graphite)]"
                  aria-label={`${t('common:navigation.labs')}, ${t('common:navigation.labsSoon')}`}
                >
                  {t('common:navigation.labs')}
                  <span className="rounded bg-[var(--orange-tint)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brand-orange)]">
                    {t('common:navigation.labsSoon')}
                  </span>
                </span>
                <Link
                  to={aboutLink.to}
                  params={aboutLink.params}
                  className="relative flex min-h-11 items-center text-[0.9rem] font-medium text-[var(--muted-graphite)] transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-transparent hover:text-[var(--graphite)] focus-visible:text-[var(--graphite)]"
                  activeProps={{
                    className:
                      'relative flex min-h-11 items-center text-[0.9rem] font-semibold text-[var(--graphite)] transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-[var(--brand-orange)]',
                  }}
                >
                  {aboutLink.label}
                </Link>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center">
                <LanguageSwitcher />
              </div>

              {isAuthenticated && user ? (
                <UserMenu user={user} locale={locale} />
              ) : (
                !isAuthPage && (
                  <div className="hidden items-center gap-4 md:flex">
                    <Link
                      to={LocaleRoutes.login}
                      params={localeParams(locale)}
                      className="inline-flex min-h-11 items-center text-[0.9rem] font-medium text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)]"
                    >
                      {t('common:actions.signIn')}
                    </Link>
                    <Button
                      size="sm"
                      asChild
                      className="rounded-md bg-[var(--brand-orange)] px-4 text-[var(--paper-surface)] shadow-none hover:bg-[var(--brand-orange)]/90"
                    >
                      <Link
                        to={LocaleRoutes.register}
                        params={localeParams(locale)}
                      >
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
                className="md:hidden"
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
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-[var(--graphite)]/15"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="relative flex h-full w-full max-w-[22rem] flex-col border-r border-[var(--soft-border)] bg-[var(--paper-surface)] px-5 py-5 animate-slide-in-left"
          >
            <div className="mb-7 flex items-center justify-between">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="group inline-flex min-h-11 items-center"
              >
                <span className="relative text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--graphite)] after:absolute after:-bottom-1 after:left-[57%] after:h-[2px] after:w-9 after:-rotate-6 after:bg-[var(--brand-orange)] after:content-[''] group-hover:text-[var(--brand-orange)]">
                  TestingWith
                  <span className="text-[var(--brand-orange)]">Ekki</span>
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
                    className="flex min-h-12 items-center border-b border-transparent px-1 text-[1rem] font-medium text-[var(--graphite)] transition-colors hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)]"
                    activeProps={{
                      className:
                        'flex min-h-12 items-center border-b-2 border-[var(--brand-orange)] px-1 text-[1rem] font-semibold text-[var(--graphite)]',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}

                <span
                  className="flex min-h-12 items-center gap-2 px-1 text-[1rem] font-medium text-[var(--muted-graphite)]"
                  aria-label={`${t('common:navigation.labs')}, ${t('common:navigation.labsSoon')}`}
                >
                  {t('common:navigation.labs')}
                  <span className="rounded bg-[var(--orange-tint)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brand-orange)]">
                    {t('common:navigation.labsSoon')}
                  </span>
                </span>

                <Link
                  to={aboutLink.to}
                  params={aboutLink.params}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex min-h-12 items-center border-b border-transparent px-1 text-[1rem] font-medium text-[var(--graphite)] transition-colors hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)]"
                  activeProps={{
                    className:
                      'flex min-h-12 items-center border-b-2 border-[var(--brand-orange)] px-1 text-[1rem] font-semibold text-[var(--graphite)]',
                  }}
                >
                  {aboutLink.label}
                </Link>
              </div>

              <div className="my-5 border-t border-[var(--soft-border)]" />

              <Link
                to={LocaleRoutes.contact}
                params={localeParams(locale)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-12 items-center px-1 text-[1rem] font-medium text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)] focus-visible:text-[var(--brand-orange)]"
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
                      className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)]"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      {t('common:navigation.profile')}
                    </Link>
                    <Link
                      to={LocaleRoutes.leaderboard}
                      params={localeParams(locale)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)]"
                    >
                      <Trophy className="h-4 w-4" aria-hidden="true" />
                      {t('common:navigation.leaderboard')}
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex min-h-12 items-center gap-3 px-1 text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)]"
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
                          <button className="inline-flex items-center gap-3 text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)]">
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
                      className="flex min-h-12 w-full items-center gap-3 px-1 text-left text-[var(--brand-error)] transition-colors hover:text-[var(--brand-error)]/80"
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
                      className="flex min-h-12 items-center gap-3 px-1 text-[1rem] font-medium text-[var(--graphite)] transition-colors hover:text-[var(--brand-orange)]"
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
                  className="h-12 w-full rounded-md bg-[var(--brand-orange)] text-[var(--paper-surface)] shadow-none hover:bg-[var(--brand-orange)]/90"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link to={primaryCta.to} params={primaryCta.params}>
                    {t('common:actions.startWebAutomation')}
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
  // If session existence changes, re-render
  if (!!prev.session !== !!next.session) return false;
  // If both null, no change
  if (!prev.session && !next.session) return true;

  // Check user details specifically (name, image, email)
  return (
    prev.session?.user?.id === next.session?.user?.id &&
    prev.session?.user?.name === next.session?.user?.name &&
    prev.session?.user?.image === next.session?.user?.image &&
    prev.session?.user?.email === next.session?.user?.email &&
    prev.session?.user?.role === next.session?.user?.role
  );
}

export default Header;
