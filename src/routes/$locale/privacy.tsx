import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { createSeoHead } from '@/lib/seo';
import {
  PageContainer,
  PaperSurface,
  SectionHeading,
} from '@/components/cozy-quest';

export const Route = createFileRoute('/$locale/privacy')({
  component: PrivacyPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Privacy Policy | TestingWithEkki',
      description:
        'Privacy Policy for TestingWithEkki — how we collect, use, and protect your data.',
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
    <main className="min-h-screen py-8 sm:py-10 lg:py-12">
      <PageContainer width="narrow">
        <PaperSurface className="px-6 py-8 sm:px-10 sm:py-10">
          <SectionHeading
            as="h1"
            eyebrow={t('privacy.lastUpdated')}
            title={t('privacy.title')}
          />
        </PaperSurface>
        <PaperSurface
          className="mt-6 px-6 py-8 sm:px-10 sm:py-10"
          texture={false}
        >
          <div className="prose-custom max-w-none">
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
        </PaperSurface>
      </PageContainer>
    </main>
  );
}
