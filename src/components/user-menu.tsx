'use client';

import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';
import {
  Bug,
  LayoutDashboard,
  LogOut,
  Trophy,
  User as UserIcon,
} from 'lucide-react';
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
import { signOut } from '@/lib/auth.client';
import { BugReportDialog } from '@/components/bug-report-dialog';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { type AuthSession } from '@/server/auth.fn';

interface UserMenuProps {
  user: NonNullable<AuthSession['user']>;
  locale: string;
}

const UserMenuComponent = ({ user, locale }: UserMenuProps) => {
  const { t } = useTranslation(['common', 'bugs']);
  const isAdmin = user.role === 'ADMIN';

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-11 rounded-full border border-[var(--brand-orange)]/70 bg-[var(--paper-surface)] p-0 shadow-none transition-colors hover:border-[var(--brand-orange)] hover:bg-[var(--orange-tint)]/45"
          aria-label="Open account menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-[var(--orange-tint)] text-[var(--brand-orange)] font-medium">
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
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
                  className="h-5 w-fit border-brand-orange/25 bg-brand-orange-tint px-1.5 text-[10px] uppercase tracking-wider text-brand-orange"
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
            <UserIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
            {t('common:navigation.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to={LocaleRoutes.leaderboard}
            params={localeParams(locale)}
            className="cursor-pointer font-medium"
          >
            <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
            {t('common:navigation.leaderboard')}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              to="/admin"
              className="cursor-pointer font-medium text-brand-orange focus:bg-brand-orange-tint focus:text-brand-orange"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('common:navigation.admin')}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
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
  );
};

export const UserMenu = memo(UserMenuComponent, (prev, next) => {
  return (
    prev.locale === next.locale &&
    prev.user.id === next.user.id &&
    prev.user.name === next.user.name &&
    prev.user.image === next.user.image &&
    prev.user.email === next.user.email &&
    prev.user.role === next.user.role
  );
});
