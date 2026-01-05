import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { localeParams, LocaleRoutes } from '@/lib/navigation';

interface AuthGuardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function AuthGuardDialog({
    open,
    onOpenChange,
    title,
    description,
}: AuthGuardDialogProps) {
    const { t } = useTranslation(['auth', 'common']);
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams({ strict: false }) as { locale?: string };
    const locale = params.locale || 'en';

    const displayTitle = title || t('auth:guard.title');
    const displayDescription = description || t('auth:guard.description');

    const handleLogin = () => {
        // Redirect to login with return path
        navigate({
            to: LocaleRoutes.login,
            params: localeParams(locale),
            search: {
                redirect: location.pathname,
            },
        }).catch(console.error);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogIn className="h-5 w-5 text-primary" />
                        {displayTitle}
                    </DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    {displayDescription}
                </DialogDescription>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('common:actions.cancel')}
                    </Button>
                    <Button onClick={handleLogin}>
                        {t('common:actions.signIn')} / {t('common:actions.signUp')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
