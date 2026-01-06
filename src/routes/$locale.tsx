import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { I18nProvider } from '@/components/I18nProvider';
import { isValidLocale, fallbackLng } from '@/lib/i18n/settings';

export const Route = createFileRoute('/$locale')({
    beforeLoad: ({ params }) => {
        const { locale } = params;

        // Redirect invalid locales to fallback
        if (!isValidLocale(locale)) {
            throw redirect({
                to: '/$locale',
                params: { locale: fallbackLng },
                replace: true,
            });
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
