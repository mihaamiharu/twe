import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ResetConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function ResetConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
}: ResetConfirmDialogProps) {
    const { t } = useTranslation(['challenges', 'common']);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-destructive/10 p-2 rounded-full">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <DialogTitle>{t('challenges:playground.resetTitle')}</DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription>
                    {t('challenges:playground.resetDescription')}
                </DialogDescription>
                <DialogFooter className="mt-4 sm:justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-accent"
                    >
                        {t('common:actions.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="shadow-sm"
                    >
                        {t('common:actions.reset')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
