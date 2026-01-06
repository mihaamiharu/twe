import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/$locale/privacy')({
    component: PrivacyPage,
});

function PrivacyPage() {
    const { t } = useTranslation('legal');

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8">
                {t('privacy.title')}
            </h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="text-muted-foreground italic">
                    {t('privacy.placeholder')}
                </p>
            </div>
        </div>
    );
}
