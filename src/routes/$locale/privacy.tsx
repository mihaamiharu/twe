import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/privacy')({
  component: PrivacyPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Privacy Policy | TestingWithEkki',
      description: 'Privacy Policy for TestingWithEkki — how we collect, use, and protect your data.',
      path: '/privacy',
      locale,
    });
  },
});

function PrivacyPage() {
  const { t } = useTranslation('legal');

  // Helper to get array items safely
  const getItems = (key: string): string[] => {
    const items = t(key, { returnObjects: true });
    return (Array.isArray(items) ? items : []) as string[];
  };

  const renderSection = (key: string) => (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-foreground/90">
        {t(`privacy.sections.${key}.title`)}
      </h2>
      {t(`privacy.sections.${key}.content`, { defaultValue: '' }) && (
        <p className="mb-4 text-muted-foreground leading-relaxed">
          {t(`privacy.sections.${key}.content`)}
        </p>
      )}
      {getItems(`privacy.sections.${key}.items`).length > 0 && (
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          {getItems(`privacy.sections.${key}.items`).map((item, idx) => (
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
      {/* Header */}
      <div className="mb-12 border-b border-border/40 pb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('privacy.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('privacy.lastUpdated')}
        </p>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-lg leading-relaxed mb-12">
          {t('privacy.intro')}
        </p>

        {renderSection('definitions')}
        {renderSection('lawfulBasis')}
        {renderSection('whatWeCollect')}
        {renderSection('howWeUse')}
        {renderSection('dataSubjectRights')}
        {renderSection('dataRetention')}
        {renderSection('security')}
        {renderSection('contact')}
      </div>
    </div>
  );
}
