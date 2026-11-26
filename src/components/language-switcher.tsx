'use client';

import { useParams, useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supportedLngs, type Locale } from '@/lib/i18n/settings';
import { cn } from '@/lib/utils';

const languageNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

export function LanguageSwitcher({
  tone = 'light',
}: {
  tone?: 'light' | 'dark';
}) {
  const location = useLocation();
  const params = useParams({ strict: false });
  const currentLocale = (params.locale as Locale) || 'en';
  const isDark = tone === 'dark';

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Replace the locale segment in the current path
    const currentPath = location.pathname;
    const pathSegments = currentPath.split('/');

    // The locale is always the first segment after the leading slash
    if (
      pathSegments.length > 1 &&
      supportedLngs.includes(pathSegments[1] as Locale)
    ) {
      pathSegments[1] = newLocale;
      const newPath = pathSegments.join('/');
      // Use window.location for clean navigation with dynamic paths
      window.location.href = newPath;
    } else {
      // If no locale in path, navigate to /$locale
      window.location.href = `/${newLocale}`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className={cn(
            'min-w-[4.75rem] gap-1 rounded-md px-2 text-[0.875rem] font-medium shadow-none transition-[background-color,color] duration-200',
            isDark
              ? 'text-[#f4f3ee] hover:bg-white/10 hover:text-white'
              : 'text-[var(--graphite)] hover:bg-[var(--orange-tint)] hover:text-[var(--graphite)]',
          )}
        >
          {/* Visible text stays part of the accessible name. */}
          <span className="sr-only">
            {`Switch language, currently ${languageNames[currentLocale]}:`}
          </span>
          <span
            className={cn(
              currentLocale === 'en'
                ? isDark
                  ? 'text-white'
                  : 'text-foreground'
                : isDark
                  ? 'text-[#9e9d95]'
                  : 'text-muted-foreground',
            )}
          >
            EN
          </span>
          <span className={isDark ? 'text-[#7f8079]' : 'text-muted-foreground'}>
            /
          </span>
          <span
            className={cn(
              currentLocale === 'id'
                ? isDark
                  ? 'text-white'
                  : 'text-foreground'
                : isDark
                  ? 'text-[#9e9d95]'
                  : 'text-muted-foreground',
            )}
          >
            ID
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLngs.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className={currentLocale === locale ? 'bg-accent' : ''}
          >
            {languageNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
