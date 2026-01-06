import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TierSkipTipProps {
    currentTier: string;
    missingPrerequisites: {
        tier: string;
        name: string;
    }[];
}

export function TierSkipTip({ currentTier, missingPrerequisites }: TierSkipTipProps) {
    const { t } = useTranslation(['challenges', 'common']);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || missingPrerequisites.length === 0) return null;

    const mainMissing = missingPrerequisites[0];

    return (
        <div className="group relative flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <p>
                    <span className="font-semibold">{t('challenges:playground.recommendation')}</span> {t('challenges:playground.recommendationDescription', { tier: currentTier.toLowerCase(), missingName: mainMissing.name })}
                    <Link
                        to="/$locale/challenges"
                        params={{ locale: window.location.pathname.split('/')[1] || 'en' }}
                        search={{ tier: mainMissing.tier }}
                        className="ml-2 inline-flex items-center gap-0.5 font-semibold underline decoration-amber-500/30 underline-offset-2 hover:text-amber-500 hover:decoration-amber-500"
                    >
                        {t('challenges:playground.tryPrereq', { missingName: mainMissing.name })} <ArrowRight className="h-3 w-3" />
                    </Link>
                </p>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 rounded-full text-amber-500/50 hover:bg-amber-500/10 hover:text-amber-500"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">{t('common:actions.dismiss')}</span>
            </Button>
        </div>
    );
}
