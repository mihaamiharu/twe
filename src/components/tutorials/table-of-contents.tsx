import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headers: TOCItem[];
  activeId?: string;
  className?: string;
  mode?: 'sidebar' | 'inline';
}

export function TableOfContents({
  headers,
  activeId,
  className,
  mode = 'sidebar',
}: TableOfContentsProps) {
  const { t } = useTranslation('tutorials');
  // State removed as it was unused

  if (!headers.length) return null;

  const navigation = (
    <nav aria-label={t('common:toc.title', 'On this page')} className="text-sm">
      <ul className="space-y-2.5 border-l border-border/60 pl-0.5">
        {headers.map((item) => (
          <li
            key={item.id}
            style={{ marginLeft: `${Math.max(0, item.level - 2) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  const yOffset = -100;
                  const y =
                    element.getBoundingClientRect().top +
                    window.scrollY +
                    yOffset;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                  history.pushState(null, '', `#${item.id}`);
                }
              }}
              className={cn(
                '-ml-px block border-l-2 pl-4 transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                activeId === item.id
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (mode === 'inline') {
    return (
      <details
        className={cn('rounded-xl border border-border bg-card p-4', className)}
      >
        <summary className="cursor-pointer list-none text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          {t('common:toc.title', 'On this page')}
        </summary>
        <div className="mt-4">{navigation}</div>
      </details>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="font-semibold text-sm text-foreground/80 tracking-tight flex items-center gap-2">
        {t('common:toc.title', 'On this page')}
      </div>
      {navigation}
    </div>
  );
}
