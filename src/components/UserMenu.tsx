import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';
import {
    Bug,
    LayoutDashboard,
    LogOut,

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
import { BugReportDialog } from '@/components/BugReportDialog';
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
                    className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-border/50 transition-all p-0 overflow-hidden"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || undefined} referrerPolicy="no-referrer" />
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
                        <UserIcon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary" />
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
