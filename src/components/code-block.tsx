import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Extract text content safely
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (React.isValidElement(node)) {
      return getTextContent((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
    }
    return '';
  };

  const copyToClipboard = async () => {
    const text = getTextContent(children);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="relative group rounded-lg bg-muted border border-border my-4 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-muted/50 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 opacity-50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 opacity-50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 opacity-50"></div>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground transition-colors"
          title="Copy code"
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <code className={cn('text-sm font-mono block whitespace-pre-wrap', className)} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}
