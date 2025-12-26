import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';

// Import custom theme-aware highlight.js styles
import '@/styles/highlight-github.css';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    const { resolvedTheme } = useTheme();

    return (
        <div className={cn(
            'prose max-w-none',
            resolvedTheme === 'dark' && 'prose-invert',
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    // Custom heading styles
                    h1: ({ children }) => (
                        <h1 className="text-3xl font-bold gradient-text mb-4 mt-8 first:mt-0">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-medium text-foreground mb-2 mt-4">
                            {children}
                        </h3>
                    ),
                    // Paragraph styling
                    p: ({ children }) => (
                        <p className="text-muted-foreground leading-7 mb-4">{children}</p>
                    ),
                    // Code blocks
                    pre: ({ children }) => (
                        <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto my-4 border border-border">
                            {children}
                        </pre>
                    ),
                    code: ({ className: codeClassName, children, ...props }) => {
                        const isInline = !codeClassName;
                        if (isInline) {
                            return (
                                <code
                                    className="bg-muted px-1.5 py-0.5 rounded text-primary text-sm font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className={cn('text-sm font-mono', codeClassName)} {...props}>
                                {children}
                            </code>
                        );
                    },
                    // Lists
                    ul: ({ children }) => (
                        <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-muted-foreground">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-muted-foreground">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    // Links
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {children}
                        </a>
                    ),
                    // Blockquotes with GitHub Alert support
                    blockquote: ({ children }) => {
                        // Check if it's an alert
                        let alertType: 'note' | 'tip' | 'important' | 'warning' | 'caution' | null = null;
                        let content = children;

                        // React-markdown usually wraps text in a p tag
                        const firstChild = React.Children.toArray(children)[0] as any;
                        if (firstChild && firstChild.props && firstChild.props.node && firstChild.props.node.tagName === 'p') {
                            const text = firstChild.props.children[0];
                            if (typeof text === 'string') {
                                const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
                                if (match) {
                                    alertType = match[1].toLowerCase() as any;
                                    // Remove the alert tag from the first paragraph
                                    const cleanText = text.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').trim();

                                    // We need to clone the children structure but replace the first text node
                                    // This is a bit hacky in simple React, but for basic usage:
                                    const newP = React.cloneElement(firstChild, {
                                        ...firstChild.props,
                                        children: [cleanText, ...firstChild.props.children.slice(1)]
                                    });
                                    content = [newP, ...React.Children.toArray(children).slice(1)];
                                }
                            }
                        }

                        if (alertType) {
                            const styles = {
                                note: 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300',
                                tip: 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-300',
                                important: 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300',
                                warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-300',
                                caution: 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300',
                            };

                            const titles = {
                                note: 'Mental Model', // Custom mapping for our "Mental Model"
                                tip: 'Pro Tip',
                                important: 'Key Concept',
                                warning: 'Watch Out',
                                caution: 'The Trap', // Custom mapping for "The Trap"
                            };

                            const icons = {
                                note: '🧠',
                                tip: '💡',
                                important: '🔑',
                                warning: '⚠️',
                                caution: '🪤',
                            };

                            return (
                                <div className={cn("my-6 p-4 rounded-lg border-l-4", styles[alertType])}>
                                    <div className="font-bold flex items-center gap-2 mb-2">
                                        <span>{icons[alertType]}</span>
                                        {titles[alertType]}
                                    </div>
                                    <div className="text-muted-foreground/90 space-y-2">
                                        {content}
                                    </div>
                                </div>
                            );
                        }

                        // Standard blockquote
                        return (
                            <blockquote className="border-l-4 border-primary/50 pl-4 py-1 italic text-muted-foreground my-6 bg-muted/20 rounded-r-lg">
                                {children}
                            </blockquote>
                        );
                    },
                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="w-full border-collapse border border-border">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border px-4 py-2">{children}</td>
                    ),
                    // Horizontal rule
                    hr: () => <hr className="border-border my-8" />,
                    // Images
                    img: ({ src, alt }) => (
                        <img
                            src={src}
                            alt={alt}
                            className="rounded-lg my-4 max-w-full h-auto"
                        />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownRenderer;
