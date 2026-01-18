import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
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
}

export function TableOfContents({
  headers,
  activeId,
  className,
}: TableOfContentsProps) {
  const { t } = useTranslation('tutorials');
  // State removed as it was unused

  if (!headers.length) return null;

  return (
    <div className={cn('hidden xl:block space-y-4', className)}>
      <div className="font-semibold text-sm text-foreground/80 tracking-tight flex items-center gap-2">
        {t('common:toc.title', 'On this page')}
      </div>
      <nav className="text-sm">
        <ul className="space-y-2.5 border-l border-border/50 pl-0.5">
          {headers.map((item) => (
            <li
              key={item.id}
              style={{ marginLeft: `${(item.level - 2) * 12}px` }}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(item.id);
                  if (el) {
                    const yOffset = -100; // Account for fixed header
                    const y =
                      el.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                    // Update URL hash without scroll
                    history.pushState(null, '', `#${item.id}`);
                  }
                }}
                className={cn(
                  'block pl-4 -ml-px border-l-2 transition-all duration-200 hover:text-foreground no-underline',
                  activeId === item.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:border-border',
                )}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
