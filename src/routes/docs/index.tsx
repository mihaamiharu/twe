import { createFileRoute, Link } from '@tanstack/react-router';
import { useTheme } from '@/components/theme-provider';
import {
  FileText,
  Code,
  BookOpen,
  GitBranch,
  ExternalLink,
} from 'lucide-react';

export const Route = createFileRoute('/docs/')({
  component: DocsIndexPage,
});

const docLinks = [
  {
    title: 'API Documentation',
    description: 'Interactive Swagger UI for exploring our REST API endpoints',
    href: '/docs/api',
    icon: Code,
    internal: true,
  },
  {
    title: 'Product Requirements',
    description: 'PRD - Features, user flows, and product vision',
    href: 'https://github.com/mihaamiharu/twe/blob/main/docs/PRD.md',
    icon: FileText,
    internal: false,
  },
  {
    title: 'Technical Design',
    description: 'TDD - Architecture, database schema, and technical decisions',
    href: 'https://github.com/mihaamiharu/twe/blob/main/docs/TDD.md',
    icon: GitBranch,
    internal: false,
  },
  {
    title: 'Challenge Progression',
    description: 'Learning path from Manual QA to Automation Engineer',
    href: 'https://github.com/mihaamiharu/twe/blob/main/docs/challenge_progression.md',
    icon: BookOpen,
    internal: false,
  },
];

function DocsIndexPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-background' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore the technical documentation, API reference, and learning
            resources for TestingWithEkki.
          </p>
        </div>

        {/* Doc Links Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {docLinks.map((doc) => {
            const Icon = doc.icon;
            const LinkComponent = doc.internal ? Link : 'a';
            const linkProps = doc.internal
              ? { to: doc.href }
              : {
                  href: doc.href,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                };

            return (
              <LinkComponent
                key={doc.title}
                {...linkProps}
                className={`group p-6 rounded-xl border transition-[border-color,box-shadow] duration-200 ease-(--ease-ui-out) hover:shadow-lg ${
                  isDark
                    ? 'bg-card border-border hover:border-primary/50'
                    : 'bg-white border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${isDark ? 'bg-primary/10' : 'bg-primary/5'}`}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {doc.title}
                      </h2>
                      {!doc.internal && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </LinkComponent>
            );
          })}
        </div>

        {/* Practice Library Section */}
        <div
          className={`p-8 rounded-xl ${isDark ? 'bg-card' : 'bg-white'} border`}
        >
          <h2 className="text-2xl font-bold mb-2">Practice Library</h2>
          <p className="text-muted-foreground mb-6">
            Browse the current hands-on practice catalog and its progressive
            tracks in the main app.
          </p>
          <div className="mt-6 pt-6 border-t">
            <Link
              to="/$locale/practice"
              params={{ locale: 'en' }}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Browse Practice →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
