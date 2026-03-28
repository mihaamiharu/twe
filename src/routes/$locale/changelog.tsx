import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Rocket, Sparkles, Bug, FileText, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/changelog')({
    component: ChangelogPage,
    head: ({ params }) => {
        const locale = params.locale || 'en';
        return createSeoHead({
            title: 'Changelog | TestingWithEkki',
            description: 'Latest updates, new features, improvements, and bug fixes for TestingWithEkki platform.',
            path: '/changelog',
            locale,
        });
    },
});

type EntryType = 'feature' | 'improvement' | 'fix' | 'content';

interface ChangelogEntry {
    date: string;
    version?: string;
    type: EntryType;
    title: string;
    description: string;
}

function ChangelogPage() {
    const { t } = useTranslation(['changelog', 'common']);

    // Clear new indicator on visit by saving the latest entry date
    const entries = t('entries', { returnObjects: true }) as ChangelogEntry[];

    useEffect(() => {
        if (entries.length > 0) {
            // Sort entries to find the latest date
            const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestDate = sortedEntries[0].date;
            localStorage.setItem('latestSeenChangelogDate', latestDate);
        }
    }, [entries]);

    const getTypeIcon = (type: EntryType) => {
        switch (type) {
            case 'feature':
                return <Rocket className="h-4 w-4" />;
            case 'improvement':
                return <Sparkles className="h-4 w-4" />;
            case 'fix':
                return <Bug className="h-4 w-4" />;
            case 'content':
                return <FileText className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: EntryType) => {
        switch (type) {
            case 'feature':
                return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'improvement':
                return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'fix':
                return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'content':
                return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
            default:
                return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-12 lg:px-8">
                <div className="space-y-12 lg:space-y-16">
                    {entries.map((entry, idx) => (
                        <div
                            key={idx}
                            className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-12"
                        >
                            {/* Date Column (Left) */}
                            <div className="lg:text-right">
                                <div className="sticky top-24 space-y-2">
                                    <div className="flex items-center lg:justify-end gap-2 text-sm text-muted-foreground font-mono">
                                        <Calendar className="h-4 w-4" />
                                        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                                    </div>
                                    {entry.version && (
                                        <div className="flex items-center lg:justify-end gap-2 text-xs text-muted-foreground/70 font-mono">
                                            <Tag className="h-3 w-3" />
                                            <span>v{entry.version}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content Column (Right) */}
                            <div className="relative pb-12 lg:pb-16 border-l border-border/40 pl-8 lg:pl-12 last:border-0 last:pb-0">
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-1.5 -translate-x-[5px] w-2.5 h-2.5 rounded-full bg-border ring-4 ring-background" />

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                                                getTypeColor(entry.type)
                                            )}
                                        >
                                            {getTypeIcon(entry.type)}
                                            {t(`types.${entry.type}`)}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl font-bold tracking-tight">
                                        {entry.title}
                                    </h2>

                                    <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                                        <MarkdownRenderer content={entry.description} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
