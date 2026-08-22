'use client';

import { Link, useLocation, useParams } from '@tanstack/react-router';
import { type AuthSession } from '@/server/auth.fn';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, memo } from 'react';
import {
  Bug,
  LogOut,
  Menu,
  User,
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
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-200 border-b',
          scrolled
            ? 'bg-background border-border'
            : 'bg-background border-transparent',
        )}
        style={{
          paddingRight: 'var(--removed-body-scroll-bar-size, 0px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                className="flex items-center gap-2 group"
              >
                {/* Dark Mode Logo */}
                <img
                  src="/logo-dark.svg"
                  alt="Logo"
                  className="h-8 w-8 hidden dark:block group-hover:scale-105 transition-all"
                />
                {/* Light Mode Logo */}
                <img
                  src="/logo-light.svg"
                  alt="Logo"
                  className="h-8 w-8 block dark:hidden group-hover:scale-105 transition-all"
                />
                <span className="text-xl font-bold font-sans tracking-tight text-foreground group-hover:text-primary transition-colors">
                  TestingWithEkki
                  <span className="text-primary animate-pulse">.</span>
                </span>
              </Link>

              <nav aria-label="Primary" className="hidden md:flex items-center gap-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className="relative flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent hover:text-foreground focus-visible:text-foreground"
                    activeProps={{
                      className:
                        'relative flex min-h-11 items-center text-sm font-semibold text-primary transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                <span className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground/70" aria-label={`${t('common:navigation.labs')}, ${t('common:navigation.labsSoon')}`}>
                  {t('common:navigation.labs')}
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary/80">
                    {t('common:navigation.labsSoon')}
                  </span>
                </span>
                <Link
                  to={aboutLink.to}
                  params={aboutLink.params}
                  className="relative flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-transparent hover:text-foreground focus-visible:text-foreground"
                  activeProps={{
                    className:
                      'relative flex min-h-11 items-center text-sm font-semibold text-primary transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary',
                  }}
                >
                  {aboutLink.label}
                </Link>
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3">
                <LanguageSwitcher />
              </div>

              {isAuthenticated && user ? (
                <UserMenu user={user} locale={locale} />
              ) : (
                !isAuthPage && (
                  <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                      <Link
                        to={LocaleRoutes.login}
                        params={localeParams(locale)}
                      >
                        {t('common:actions.signIn')}
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link
                        to={LocaleRoutes.register}
                        params={localeParams(locale)}
                      >
                        {t('common:actions.startWebAutomation')}
                        <span aria-hidden="true">→</span>
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
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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

      {/* Scroll Listener Space for Fixed/Sticky Header if needed in future */}

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/20"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="relative flex-1 bg-background border-r border-border max-w-[86vw] w-full p-4 animate-slide-in-left flex flex-col h-full">

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {/* Mobile Logo Rep */}
                <span className="font-bold text-lg">TestingWithEkki</span>
              </div>
              <Button ref={closeButtonRef} variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-1 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  params={link.params}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 border-b border-transparent px-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:text-foreground"
                  activeProps={{
                    className:
                      'flex min-h-11 items-center gap-3 border-b border-primary px-2 font-medium text-primary',
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <span className="flex min-h-11 items-center gap-2 px-2 text-muted-foreground/70" aria-label={`${t('common:navigation.labs')}, ${t('common:navigation.labsSoon')}`}>
                {t('common:navigation.labs')}
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary/80">
                  {t('common:navigation.labsSoon')}
                </span>
              </span>

              <Link
                to={aboutLink.to}
                params={aboutLink.params}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-11 items-center border-b border-transparent px-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:text-foreground"
                activeProps={{
                  className:
                    'flex min-h-11 items-center border-b border-primary px-2 font-medium text-primary',
                }}
              >
                {aboutLink.label}
              </Link>

              <Link
                to={LocaleRoutes.contact}
                params={localeParams(locale)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-11 items-center border-b border-transparent px-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:text-foreground"
              >
                {t('legal:contact.title')}
              </Link>

              <div className="my-6 border-t border-border/50" />

              {isAuthenticated && user ? (
                <>
                  <Link
                    to={LocaleRoutes.profile}
                    params={localeParams(locale)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    {t('common:navigation.profile')}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="px-3 py-2">
                    <BugReportDialog
                      trigger={
                        <button className="flex items-center gap-3 w-full py-1 text-muted-foreground hover:text-foreground transition-colors">
                          <Bug className="h-5 w-5" />
                          {t('bugs:dialog.trigger')}
                        </button>
                      }
                    />
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        void handleSignOut();
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      {t('common:navigation.logout')}
                    </button>
                  </div>
                </>
              ) : (
                !isAuthPage && (
                  <div className="space-y-3 mt-4">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link
                        to={LocaleRoutes.login}
                        params={localeParams(locale)}
                      >
                        {t('common:actions.signIn')}
                      </Link>
                    </Button>
                    <Button
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link
                        to={LocaleRoutes.register}
                        params={localeParams(locale)}
                      >
                        {t('common:actions.startWebAutomation')}
                        <span aria-hidden="true">→</span>
                      </Link>
                    </Button>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex gap-4">
              <LanguageSwitcher />
            </div>
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
