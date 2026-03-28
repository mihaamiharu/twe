import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HintDisplayPanelProps {
    content: string;
    onClose: () => void;
}

export function HintDisplayPanel({
    content,
    onClose,
}: HintDisplayPanelProps) {
    const { t } = useTranslation(['challenges']);

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
            <Card className="border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/95 shadow-lg backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-amber-500/20 p-1.5 rounded-full shrink-0 mt-0.5">
                            <Lightbulb className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm">
                                    {t('challenges:hints.title')}
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-500/20"
                                >
                                    ×
                                </Button>
                            </div>
                            <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed markdown-prose">
                                <ReactMarkdown
                                    components={{
                                        code: ({ className, children, ...props }) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const codeContent = String(children).replace(/\n$/, '');
                                            const isInline = !match && !codeContent.includes('\n');
                                            return (
                                                <code
                                                    className={cn(
                                                        'font-mono text-xs rounded px-1 py-0.5',
                                                        isInline
                                                            ? 'bg-amber-600/10 text-amber-800 dark:text-amber-200'
                                                            : 'block bg-black/80 text-white p-2 my-2 rounded-md overflow-x-auto',
                                                        className
                                                    )}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        },
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
