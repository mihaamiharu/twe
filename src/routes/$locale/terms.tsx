import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const Route = createFileRoute('/$locale/terms')({
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation('legal');

  // Helper to get array items safely
  const getItems = (key: string): string[] => {
    const items = t(key, { returnObjects: true });
    return (Array.isArray(items) ? items : []) as string[];
  };

  const renderSection = (key: string) => (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground/90">
        {t(`terms.sections.${key}.title`)}
      </h2>
      {t(`terms.sections.${key}.content`, { defaultValue: '' }) && (
        <p className="mb-4 text-muted-foreground leading-relaxed">
          {t(`terms.sections.${key}.content`)}
        </p>
      )}
      {getItems(`terms.sections.${key}.items`).length > 0 && (
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          {getItems(`terms.sections.${key}.items`).map((item, idx) => (
            <li key={idx} className="pl-2">
              <MarkdownRenderer content={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-12 lg:px-8">
      <div className="mb-12 border-b border-border/40 pb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {t('terms.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('terms.lastUpdated')}
        </p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed mb-12">
          {t('terms.intro')}
        </p>

        {renderSection('acceptance')}
        {renderSection('useLicense')}
        {renderSection('userObligations')}
        {renderSection('disclaimer')}
        {renderSection('governingLaw')}
        {renderSection('changes')}
      </div>
    </div>
  );
}
