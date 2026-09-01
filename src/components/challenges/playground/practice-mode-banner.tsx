import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PracticeModeBanner() {
  const { t } = useTranslation(['challenges']);

  return (
    <div className="bg-brand-warning/10 border-b border-brand-warning/30 px-4 py-2 flex items-center justify-center gap-2 text-brand-warning text-sm font-medium animate-in slide-in-from-top-2 motion-reduce:animate-none motion-reduce:opacity-100">
      <Badge
        variant="secondary"
        className="bg-brand-warning/15 text-brand-warning border-brand-warning/30"
      >
        {t('challenges:practice.badge')}
      </Badge>
      <Zap className="h-4 w-4 fill-current" />
      {t('challenges:playground.alreadyCompleted')}
    </div>
  );
}
