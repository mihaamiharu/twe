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

const languageNames: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
};

export function LanguageSwitcher() {
  const location = useLocation();
  const params = useParams({ strict: false });
  const currentLocale = (params.locale as Locale) || 'en';

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
          className="min-w-[5rem] gap-1 rounded-md px-2 font-mono text-xs tracking-wide text-[var(--graphite)] shadow-none hover:bg-[var(--orange-tint)] hover:text-[var(--graphite)]"
          aria-label={`Switch language, currently ${languageNames[currentLocale]}`}
        >
          <span
            className={
              currentLocale === 'en'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }
          >
            EN
          </span>
          <span className="text-muted-foreground">/</span>
          <span
            className={
              currentLocale === 'id'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }
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
