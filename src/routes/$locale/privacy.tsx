import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Shield, Database, Lock, Eye, Users, Bell, Mail, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export const Route = createFileRoute('/$locale/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation('legal');

  // Helper to get array items from translations
  const getItems = (key: string): string[] => {
    const items = t(key, { returnObjects: true });
    return Array.isArray(items) ? items : [];
  };

  const sections = [
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      titleKey: 'privacy.sections.noSelling.title',
      contentKey: 'privacy.sections.noSelling.content',
    },
    {
      icon: <Database className="h-5 w-5 text-blue-500" />,
      titleKey: 'privacy.sections.whatWeCollect.title',
      itemsKey: 'privacy.sections.whatWeCollect.items',
    },
    {
      icon: <Eye className="h-5 w-5 text-purple-500" />,
      titleKey: 'privacy.sections.howWeUse.title',
      itemsKey: 'privacy.sections.howWeUse.items',
    },
    {
      icon: <Lock className="h-5 w-5 text-teal-500" />,
      titleKey: 'privacy.sections.yourControl.title',
      itemsKey: 'privacy.sections.yourControl.items',
    },
    {
      icon: <Users className="h-5 w-5 text-orange-500" />,
      titleKey: 'privacy.sections.thirdParties.title',
      contentKey: 'privacy.sections.thirdParties.content',
    },
    {
      icon: <Lock className="h-5 w-5 text-indigo-500" />,
      titleKey: 'privacy.sections.security.title',
      contentKey: 'privacy.sections.security.content',
    },
    {
      icon: <Baby className="h-5 w-5 text-pink-500" />,
      titleKey: 'privacy.sections.children.title',
      contentKey: 'privacy.sections.children.content',
    },
    {
      icon: <Bell className="h-5 w-5 text-yellow-500" />,
      titleKey: 'privacy.sections.changes.title',
      contentKey: 'privacy.sections.changes.content',
    },
    {
      icon: <Mail className="h-5 w-5 text-cyan-500" />,
      titleKey: 'privacy.sections.contact.title',
      contentKey: 'privacy.sections.contact.content',
    },
  ];

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('privacy.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('privacy.lastUpdated')}
        </p>
      </div>

      {/* Intro */}
      <Card className="mb-8 bg-muted/30">
        <CardContent className="p-6">
          <p className="text-lg leading-relaxed">
            {t('privacy.intro')}
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.titleKey} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                {section.icon}
                {t(section.titleKey)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.contentKey && (
                <p className="text-muted-foreground leading-relaxed">
                  {t(section.contentKey)}
                </p>
              )}
              {section.itemsKey && (
                <ul className="space-y-2">
                  {getItems(section.itemsKey).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="prose prose-sm dark:prose-invert">
                        <MarkdownRenderer content={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
