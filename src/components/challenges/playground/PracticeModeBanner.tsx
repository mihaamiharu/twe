import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PracticeModeBanner() {
    const { t } = useTranslation(['challenges']);

    return (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center justify-center gap-2 text-blue-600 text-sm font-medium animate-in slide-in-from-top-2">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300">
                {t('challenges:practice.badge')}
            </Badge>
            <Zap className="h-4 w-4 fill-current" />
            {t('challenges:playground.alreadyCompleted')}
        </div>
    );
}
