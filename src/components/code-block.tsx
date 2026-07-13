import { Check, Copy } from 'lucide-react';
import { isValidElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TechnicalSurface } from '@/components/cozy-quest';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'tutorial';
}

export function CodeBlock({
  children,
  className,
  variant = 'default',
  ...props
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation('tutorials');

  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    if (isValidElement<{ children?: React.ReactNode }>(node)) {
      return getTextContent(node.props.children);
    }
    return '';
  };

  const copyToClipboard = async () => {
    const text = getTextContent(children);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(t('code.copied'));
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error(t('code.copyFailed'));
    }
  };

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden',
        variant === 'tutorial'
          ? 'rounded-[calc(0.75rem-2px)] bg-background'
          : 'my-4 rounded-lg border border-border bg-muted',
      )}
    >
      <div className="flex justify-between items-center px-4 py-2 bg-muted/50 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 opacity-50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 opacity-50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 opacity-50"></div>
        </div>
        <button
          onClick={() => void copyToClipboard()}
          className="p-1.5 rounded-md hover:bg-background/50 text-muted-foreground transition-colors"
          title={t('code.copy')}
          aria-label={isCopied ? t('code.copied') : t('code.copy')}
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 scrollbar-thin">
        <code
          className={cn(
            'block min-w-max text-sm font-mono',
            variant === 'tutorial' ? 'whitespace-pre' : 'whitespace-pre-wrap',
            className,
          )}
          {...props}
        >
          {children}
        </code>
      </div>
    </div>
  );

  return variant === 'tutorial' ? (
    <TechnicalSurface className="my-6 overflow-hidden p-0">
      {content}
    </TechnicalSurface>
  ) : (
    content
  );
}
