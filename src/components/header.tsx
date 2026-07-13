import { Link, useLocation, useParams } from '@tanstack/react-router';
import { type AuthSession } from '@/server/auth.fn';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, memo } from 'react';
import {
  BookOpen,
  Bug,
  Code,
  LogOut,
  Menu,
  Trophy,
  User,
  X,
  LayoutDashboard,
  Info,
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

  const { t } = useTranslation(['common', 'bugs']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Dynamic nav links based on locale
  const navLinks = [
    {
      to: LocaleRoutes.tutorials,
      params: localeParams(locale),
      label: t('common:navigation.tutorials'),
      concept: t('common:navigation.tutorialsConcept'),
      icon: BookOpen,
    },
    {
      to: LocaleRoutes.challenges,
      params: localeParams(locale),
      label: t('common:navigation.challenges'),
      concept: t('common:navigation.challengesConcept'),
      icon: Code,
    },
    {
      to: LocaleRoutes.leaderboard,
      params: localeParams(locale),
      label: t('common:navigation.leaderboard'),
      concept: t('common:navigation.leaderboardConcept'),
      icon: Trophy,
    },
    {
      to: LocaleRoutes.about,
      params: localeParams(locale),
      label: t('common:navigation.about'),
      concept: t('common:navigation.aboutConcept'),
      icon: Info,
    },
  ];

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
          'sticky top-0 z-40 w-full border-b transition-all duration-200',
          scrolled
            ? 'border-border bg-card/95 shadow-[0_10px_28px_rgba(73,62,45,0.08)] backdrop-blur-md'
            : 'border-border/70 bg-background/92 backdrop-blur-sm',
        )}
        style={{
          paddingRight: 'var(--removed-body-scroll-bar-size, 0px)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6 xl:gap-8">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                className="flex items-center gap-2 group"
              >
                <img
                  src="/logo-icon.svg"
                  alt=""
                  className="h-9 w-9 transition-transform group-hover:-rotate-3 group-hover:scale-105"
                />
                <span className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                  TestingWithEkki
                  <span className="text-primary">.</span>
                </span>
              </Link>

              <nav
                className="hidden items-center gap-1 lg:flex"
                aria-label={t('common:navigation.primary')}
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                    activeProps={{
                      className:
                        'bg-secondary text-primary shadow-sm ring-1 ring-border/70',
                    }}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="flex flex-col leading-none">
                      <span className="font-semibold">{link.label}</span>
                      <span className="mt-1 hidden text-[10px] uppercase tracking-[0.12em] text-muted-foreground xl:block">
                        {link.concept}
                      </span>
                    </span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className="mr-1 hidden items-center sm:flex">
                <LanguageSwitcher />
              </div>

              {isAuthenticated && user ? (
                <UserMenu user={user} locale={locale} />
              ) : (
                !isAuthPage && (
                  <div className="hidden items-center gap-2 lg:flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        to={LocaleRoutes.login}
                        params={localeParams(locale)}
                      >
                        {t('common:navigation.login')}
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="shadow-sm">
                      <Link
                        to={LocaleRoutes.register}
                        params={localeParams(locale)}
                      >
                        {t('common:actions.startLearning')}
                      </Link>
                    </Button>
                  </div>
                )
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
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
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <nav
            id="mobile-navigation"
            className="relative flex h-full w-full max-w-[22rem] flex-1 flex-col border-r border-border bg-card p-5 shadow-2xl animate-in slide-in-from-left"
            aria-label={t('common:navigation.mobile')}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img src="/logo-icon.svg" alt="" className="size-9" />
                <span className="text-lg font-bold">TestingWithEkki</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('common:actions.closeMenu')}
              >
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
                  className="flex items-center gap-3 rounded-xl p-3 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                  activeProps={{
                    className: 'bg-secondary font-medium text-primary',
                  }}
                >
                  <link.icon className="h-5 w-5" />
                  <span className="flex flex-col">
                    <span className="font-semibold">{link.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {link.concept}
                    </span>
                  </span>
                </Link>
              ))}

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
                        {t('common:navigation.login')}
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
                        {t('common:actions.startLearning')}
                      </Link>
                    </Button>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex gap-4 border-t border-border/60 pt-4">
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
