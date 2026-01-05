import { createFileRoute, redirect } from '@tanstack/react-router';
import { fallbackLng } from '@/lib/i18n/settings';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Redirect root to default locale
    throw redirect({
      to: '/$locale',
      params: { locale: fallbackLng },
      replace: true,
    });
  },
  component: () => null,
});
