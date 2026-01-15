import { Link, useLocation, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

export function Header() {
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
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-200 border-b',
          scrolled
            ? 'bg-background/80 backdrop-blur-md border-border/40 shadow-sm'
            : 'bg-background/0 border-transparent',
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
                  src="/logo-dark-new.png"
                  alt="Logo"
                  className="h-8 w-8 rounded-lg hidden dark:block mix-blend-screen opacity-90 group-hover:opacity-100 transition-all group-hover:scale-105"
                />
                {/* Light Mode Logo */}
                <img
                  src="/logo-light-new.png"
                  alt="Logo"
                  className="h-8 w-8 rounded-lg block dark:hidden mix-blend-multiply opacity-90 group-hover:opacity-100 transition-all group-hover:scale-105"
                />
                <span className="text-xl font-bold font-sans tracking-tight text-foreground group-hover:text-primary transition-colors">
                  TestingWithEkki
                  <span className="text-primary animate-pulse">.</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    params={link.params}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
                    activeProps={{
                      className:
                        'text-primary bg-primary/5 hover:bg-primary/10 font-semibold shadow-sm ring-1 ring-border/20',
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
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>

              {isPending ? (
                <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border/50 transition-all p-0 overflow-hidden"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-medium">
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
                          <div className="flex items-center gap-1 mt-1.5">
                            <Badge
                              variant="outline"
                              className="w-fit bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 text-[10px] h-5 px-1.5 uppercase tracking-wider"
                            >
                              Admin
                            </Badge>
                          </div>
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
                        <User className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        {t('common:navigation.profile')}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin"
                          className="cursor-pointer font-medium text-purple-600 focus:text-purple-600 focus:bg-purple-50 dark:focus:bg-purple-500/10"
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
                        <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
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
                              <Bug className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              {t('bugs:dialog.trigger')}
                            </div>
                          }
                        />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => void handleSignOut()}
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common:navigation.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                !isAuthPage && (
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
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
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <nav className="relative flex-1 bg-background border-r border-border/50 max-w-[80vw] w-full p-4 animate-slide-in-left shadow-2xl flex flex-col h-full">

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {/* Mobile Logo Rep */}
                <span className="font-bold text-lg">TestingWithEkki</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
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
                  className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  activeProps={{
                    className:
                      'text-primary bg-primary/5 font-medium border-l-2 border-primary rounded-l-none pl-3',
                  }}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
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

            <div className="mt-4 pt-4 border-t border-border/50 flex gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default Header;
