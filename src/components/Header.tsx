import { Link, useLocation, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  BookOpen,
  Bug,
  Code,
  LogOut,
  Menu,
  Settings,
  Trophy,
  User,
  X,
  LayoutDashboard,
  Info,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession, signOut } from '@/lib/auth.client';
import { BugReportDialog } from '@/components/BugReportDialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { authQueryOptions } from '@/lib/auth.query';

export function Header() {
  const { t } = useTranslation(['common', 'bugs']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const params = useParams({ strict: false });
  const locale = params.locale || 'en';
  const isAuthPage =
    location.pathname.includes('/login') ||
    location.pathname.includes('/register');

  // Use TanStack Query to get the session (hydrated from server)
  const { data: auth } = useSuspenseQuery(authQueryOptions);
  const session = auth; // Alias for compatibility
  const isPending = false; // Suspense handles loading state

  // Dynamic nav links based on locale
  const navLinks = [
    {
      to: LocaleRoutes.tutorials,
      params: localeParams(locale),
      label: t('common:navigation.tutorials'),
      icon: BookOpen,
    },
    {
      to: LocaleRoutes.challenges,
      params: localeParams(locale),
      label: t('common:navigation.challenges'),
      icon: Code,
    },
    {
      to: LocaleRoutes.leaderboard,
      params: localeParams(locale),
      label: t('common:navigation.leaderboard'),
      icon: Trophy,
    },
    {
      to: LocaleRoutes.about,
      params: localeParams(locale),
      label: t('common:navigation.about'),
      icon: Info,
    },
  ];

  const user = session?.user;
  const isAuthenticated = !!user;
  const isAdmin = (user as { role?: string })?.role === 'ADMIN';

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
      <header className="sticky top-0 z-40 w-full border-b border-border/40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link
                to={LocaleRoutes.home}
                params={localeParams(locale)}
                className="flex items-center gap-2 btn-animate"
              >
                {/* Dark Mode Logo */}
                <img
                  src="/logo-dark-new.png"
                  alt="Logo"
                  className="h-8 w-8 rounded-lg hidden dark:block mix-blend-screen"
                />
                {/* Light Mode Logo */}
                <img
                  src="/logo-light-new.png"
                  alt="Logo"
                  className="h-8 w-8 rounded-lg block dark:hidden mix-blend-multiply"
                />
                <span className="text-xl font-bold gradient-text">
                  TestingWithEkki
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all btn-animate"
                    activeProps={{
                      className:
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-primary bg-primary/10 font-medium scale-[1.02]',
                    }}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              {isPending ? (
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(user.name || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {isAdmin && (
                          <Badge
                            variant="outline"
                            className="mt-1 w-fit bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] h-4"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={LocaleRoutes.profile}
                        params={localeParams(locale)}
                        className="cursor-pointer font-medium"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {t('common:navigation.profile')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="cursor-pointer font-medium text-purple-600 focus:text-purple-600"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t('common:navigation.admin')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        to={LocaleRoutes.settings}
                        params={localeParams(locale)}
                        className="cursor-pointer"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {t('common:navigation.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      asChild
                    >
                      <div className="w-full cursor-pointer">
                        <BugReportDialog
                          trigger={
                            <div className="flex items-center w-full gap-2">
                              <Bug className="mr-2 h-4 w-4" />
                              {t('bugs:dialog.trigger')}
                            </div>
                          }
                        />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => void handleSignOut()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common:navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !isAuthPage && (
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" asChild>
                      <Link
                        to={LocaleRoutes.login}
                        params={localeParams(locale)}
                      >
                        {t('common:navigation.login')}
                      </Link>
                    </Button>
                    <Button asChild>
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
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <nav className="fixed top-16 left-0 right-0 bg-background border-b border-border p-4 animate-slide-up">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  params={link.params}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors btn-animate"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg text-primary bg-primary/10 font-medium pl-4 border-l-2 border-primary',
                  }}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}

              {/* Bug Report - Removed from top level mobile menu */}

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
                  <div className="px-3">
                    <BugReportDialog
                      trigger={
                        <button className="flex items-center gap-3 w-full py-3 text-muted-foreground hover:text-foreground transition-colors">
                          <Bug className="h-5 w-5" />
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
                    className="flex items-center gap-3 p-3 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('common:navigation.logout')}
                  </button>
                </>
              ) : (
                !isAuthPage && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
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
                      className="w-full"
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
          </nav>
        </div>
      )}
    </>
  );
}

export default Header;
