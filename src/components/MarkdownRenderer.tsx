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
                        <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li className="pl-2">{children}</li>,
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
                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                            {children}
                        </blockquote>
                    ),
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
