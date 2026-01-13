import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// Explicitly import languages that might not be in the common set
import xquery from 'highlight.js/lib/languages/xquery';
import bash from 'highlight.js/lib/languages/bash'; // Often good for CLI commands
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';

import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { CodeBlock } from '@/components/CodeBlock';

// Import custom theme-aware highlight.js styles
import '@/styles/highlight-github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div
      className={cn(
        'prose prose-lg max-w-none',
        resolvedTheme === 'dark' && 'prose-invert',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeHighlight,
            {
              languages: {
                xpath: xquery,
                bash,
                json,
                typescript,
              },
              detect: true,
            },
          ],
        ]}
        components={{
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold gradient-text mb-4 mt-8 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text =
              typeof children === 'string' ? children : String(children);
            const id = text.toLowerCase().replace(/[^\w]+/g, '-');
            return (
              <h2
                id={id}
                className="text-2xl font-semibold text-foreground mb-3 mt-6 border-b border-border pb-2 scroll-mt-24"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text =
              typeof children === 'string' ? children : String(children);
            const id = text.toLowerCase().replace(/[^\w]+/g, '-');
            return (
              <h3
                id={id}
                className="text-xl font-medium text-foreground mb-2 mt-4 scroll-mt-24"
              >
                {children}
              </h3>
            );
          },
          // Paragraph styling
          p: ({ children }) => (
            <p className="text-muted-foreground leading-7 mb-4">{children}</p>
          ),
          // Code blocks
          pre: ({ children }) => <div className="not-prose">{children}</div>,
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-primary text-sm font-mono border border-border/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Check for html-preview language
            const match = /language-([\w-]+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';

            if (language === 'html-preview') {
              const src = String(children).trim();
              return (
                <div className="my-6 rounded-lg border-2 border-border overflow-hidden bg-background">
                  <div className="bg-muted/50 px-4 py-2 border-b border-border text-xs font-mono text-muted-foreground flex items-center justify-between">
                    <span>Preview: {src}</span>
                    <span className="text-[10px] uppercase tracking-wider">
                      Static HTML
                    </span>
                  </div>
                  <iframe
                    src={src}
                    className="w-full h-[400px] bg-white dark:bg-zinc-950"
                    title="Preview"
                  />
                </div>
              );
            }

            return (
              <CodeBlock className={codeClassName} {...props}>
                {children}
              </CodeBlock>
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
          // Blockquotes with GitHub Alert support
          blockquote: ({ children }) => {
            // Helper to find the first text node deeply, ignoring whitespace
            const findFirstTextNode = (
              nodes: React.ReactNode,
            ): { text: string; location: number[] } | null => {
              const nodeArray = React.Children.toArray(nodes);
              for (let i = 0; i < nodeArray.length; i++) {
                const node = nodeArray[i];
                if (typeof node === 'string') {
                  // Skip whitespace-only strings
                  if (node.trim().length > 0) {
                    return { text: node, location: [i] };
                  }
                  continue;
                }
                if (
                  React.isValidElement(node) &&
                  (node.props as { children?: React.ReactNode }).children
                ) {
                  const result = findFirstTextNode(
                    (node.props as { children?: React.ReactNode }).children,
                  );
                  if (result) {
                    return {
                      text: result.text,
                      location: [i, ...result.location],
                    };
                  }
                }
              }
              return null;
            };

            const result = findFirstTextNode(children);

            // Check if it matches alert pattern.
            // Note: We don't use ^ anchor because the string might have leading newlines from markdown parsing
            const alertMatch = result?.text.match(
              /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
            );

            if (alertMatch) {
              const alertType = alertMatch[1].toLowerCase() as
                | 'note'
                | 'tip'
                | 'important'
                | 'warning'
                | 'caution';

              // Recursive function to clone the tree and strip the alert text
              const cloneAndStrip = (
                nodes: React.ReactNode,
                path: number[],
              ): React.ReactNode => {
                if (path.length === 0) return nodes;

                const nodeArray = React.Children.toArray(nodes);
                const index = path[0];
                const node = nodeArray[index];

                if (path.length === 1) {
                  // Base case: we found the node containing the text
                  if (typeof node === 'string') {
                    const newText = node
                      .replace(
                        /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i,
                        '',
                      )
                      .trim();
                    // Replace the node with the striped text
                    // If removing it leaves it empty, we might want to return nothing, but returning empty string is safer
                    nodeArray[index] = newText;
                    return nodeArray;
                  }
                }

                // Recursive step
                if (React.isValidElement(node)) {
                  const nodeProps = node.props as {
                    children?: React.ReactNode;
                  };
                  const newChildren = cloneAndStrip(
                    nodeProps.children,
                    path.slice(1),
                  );
                  nodeArray[index] = React.cloneElement(node, {
                    ...nodeProps,
                    children: newChildren,
                  } as React.Attributes & { children?: React.ReactNode });
                }

                return nodeArray;
              };

              // We need to pass the location we found earlier
              // result.location is the path to the text node
              let content = children;
              if (result) {
                // Since React.Children.toArray flattens fragments, the path logic above is simplified.
                // However, finding the node logic matches pure React.Children iteration.
                // So we can re-use the path found by findFirstTextNode
                content = cloneAndStrip(children, result.location);
              }

              const styles = {
                note: 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300',
                tip: 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-300',
                important:
                  'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300',
                warning:
                  'bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-300',
                caution:
                  'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300',
              };

              const titles = {
                note: 'Mental Model',
                tip: 'Pro Tip',
                important: 'Key Concept',
                warning: 'Watch Out',
                caution: 'The Trap',
              };

              const icons = {
                note: '🧠',
                tip: '💡',
                important: '🔑',
                warning: '⚠️',
                caution: '🪤',
              };

              return (
                <div
                  className={cn(
                    'my-6 p-4 rounded-lg border-l-4',
                    styles[alertType],
                  )}
                >
                  <div className="font-bold flex items-center gap-2 mb-2 select-none">
                    <span className="text-xl">{icons[alertType]}</span>
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
            <div className="overflow-x-auto my-6 rounded-xl border-2 border-border">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border/50 bg-muted/50 px-6 py-3 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/50 px-6 py-3">{children}</td>
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
