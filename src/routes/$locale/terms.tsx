import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/$locale/terms')({
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation('legal');

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        {t('terms.title')}
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>{t('terms.lastUpdated')}: {new Date().toLocaleDateString()}</p>

        <h2>{t('terms.sections.acceptance.title')}</h2>
        <p>
          {t('terms.sections.acceptance.content')}
        </p>

        <h2>{t('terms.sections.description.title')}</h2>
        <p>
          {t('terms.sections.description.content')}
        </p>

        <h2>{t('terms.sections.accounts.title')}</h2>
        <p>
          {t('terms.sections.accounts.content')}
        </p>

        <h2>{t('terms.sections.conduct.title')}</h2>
        <p>
          {t('terms.sections.conduct.content')}
        </p>
      </div>
    </div>
  );
}
