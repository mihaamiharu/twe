'use client';

import { useParams, useLocation } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { supportedLngs, type Locale } from '@/lib/i18n/settings';

const languageNames: Record<Locale, string> = {
    en: 'English',
    id: 'Bahasa Indonesia',
};

const languageFlags: Record<Locale, string> = {
    en: '🇺🇸',
    id: '🇮🇩',
};

export function LanguageSwitcher() {
    const location = useLocation();
    const params = useParams({ strict: false }) as { locale?: string };
    const currentLocale = (params.locale as Locale) || 'en';

    const handleLanguageChange = (newLocale: Locale) => {
        if (newLocale === currentLocale) return;

        // Replace the locale segment in the current path
        const currentPath = location.pathname;
        const pathSegments = currentPath.split('/');

        // The locale is always the first segment after the leading slash
        if (pathSegments.length > 1 && supportedLngs.includes(pathSegments[1] as Locale)) {
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
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{languageFlags[currentLocale]}</span>
                    <span className="sr-only">Switch language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {supportedLngs.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => handleLanguageChange(locale)}
                        className={currentLocale === locale ? 'bg-accent' : ''}
                    >
                        <span className="mr-2">{languageFlags[locale]}</span>
                        {languageNames[locale]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
