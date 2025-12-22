import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';

interface AuthGuardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function AuthGuardDialog({
    open,
    onOpenChange,
    title = 'Sign in Required',
    description = 'You need to be signed in to save your progress and earn XP. Don\'t worry, your work will be saved.',
}: AuthGuardDialogProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = () => {
        // Redirect to login with return path
        navigate({
            to: '/login',
            search: {
                redirect: location.pathname,
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LogIn className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleLogin}>
                        Sign In / Register
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
