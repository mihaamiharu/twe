import { useTranslation } from 'react-i18next';
import { Lightbulb, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface HintConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isPending: boolean;
}

export function HintConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending,
}: HintConfirmDialogProps) {
    const { t } = useTranslation(['challenges', 'common']);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-500/10 p-2 rounded-full">
                            <Lightbulb className="h-5 w-5 text-amber-600" />
                        </div>
                        <DialogTitle>{t('challenges:hints.warningTitle')}</DialogTitle>
                    </div>
                </DialogHeader>
                <DialogDescription className="space-y-3" asChild>
                    <div className="text-muted-foreground text-sm space-y-3">
                        <p>{t('challenges:hints.warning')}</p>
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span className="text-sm font-medium text-amber-700">
                                {t('challenges:hints.penalty')}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border/50">
                            {t('challenges:hints.freeTierNote')}
                        </p>
                    </div>
                </DialogDescription>
                <DialogFooter className="mt-4 sm:justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="hover:bg-accent"
                    >
                        {t('challenges:hints.cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {t('challenges:hints.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
