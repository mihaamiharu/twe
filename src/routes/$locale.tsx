import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { I18nProvider } from '@/components/I18nProvider';
import { isValidLocale, fallbackLng } from '@/lib/i18n/settings';
import i18n from '@/lib/i18n';

export const Route = createFileRoute('/$locale')({
  beforeLoad: async ({ params }) => {
    const { locale } = params;

    // Redirect invalid locales to fallback
    if (!isValidLocale(locale)) {
      throw redirect({
        to: '/$locale',
        params: { locale: fallbackLng },
        replace: true,
      });
    }

    // TANSTACK PATTERN: Switch language before route loads to prevent flash
    if (i18n.language !== locale) {
      await i18n.changeLanguage(locale);
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();

  return (
    <I18nProvider locale={locale}>
      <Outlet />
    </I18nProvider>
  );
}
