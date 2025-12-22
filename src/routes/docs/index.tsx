import { createFileRoute, Link } from '@tanstack/react-router';
import { useTheme } from '@/components/theme-provider';
import { FileText, Code, BookOpen, GitBranch, ExternalLink } from 'lucide-react';

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

const challengeTiers = [
    { tier: 'Basic', count: 23, focus: 'CSS Selectors, XPath', color: 'bg-green-500/20 text-green-400' },
    { tier: 'Beginner', count: 23, focus: 'JavaScript, DOM', color: 'bg-blue-500/20 text-blue-400' },
    { tier: 'Intermediate', count: 29, focus: 'Playwright', color: 'bg-yellow-500/20 text-yellow-400' },
    { tier: 'Expert', count: 21, focus: 'Real-World Patterns', color: 'bg-red-500/20 text-red-400' },
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
                        Explore the technical documentation, API reference, and learning resources
                        for TestingWithEkki.
                    </p>
                </div>

                {/* Doc Links Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    {docLinks.map((doc) => {
                        const Icon = doc.icon;
                        const LinkComponent = doc.internal ? Link : 'a';
                        const linkProps = doc.internal
                            ? { to: doc.href }
                            : { href: doc.href, target: '_blank', rel: 'noopener noreferrer' };

                        return (
                            <LinkComponent
                                key={doc.title}
                                {...linkProps}
                                className={`group p-6 rounded-xl border transition-all hover:shadow-lg ${isDark
                                        ? 'bg-card border-border hover:border-primary/50'
                                        : 'bg-white border-gray-200 hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${isDark ? 'bg-primary/10' : 'bg-primary/5'}`}>
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

                {/* Challenge Library Section */}
                <div className={`p-8 rounded-xl ${isDark ? 'bg-card' : 'bg-white'} border`}>
                    <h2 className="text-2xl font-bold mb-2">Challenge Library</h2>
                    <p className="text-muted-foreground mb-6">
                        96 challenges across 4 progressive difficulty tiers
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {challengeTiers.map((tier) => (
                            <div
                                key={tier.tier}
                                className={`p-4 rounded-lg ${tier.color} border border-current/10`}
                            >
                                <div className="text-2xl font-bold">{tier.count}</div>
                                <div className="font-medium">{tier.tier}</div>
                                <div className="text-sm opacity-80">{tier.focus}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t">
                        <Link
                            to="/challenges"
                            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                        >
                            Browse All Challenges →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
