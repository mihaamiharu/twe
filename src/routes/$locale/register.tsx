import {
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { RegisterForm } from '@/components/auth';
import { AuthPageShell } from '@/components/auth';
import { useTranslation } from 'react-i18next';
import type { RootContext } from '../__root';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/register')({
  beforeLoad: ({ context, params }) => {
    const { auth } = context as RootContext;
    if (auth?.isAuthenticated) {
      throw redirect({
        to: LocaleRoutes.home,
        params: localeParams(params.locale),
      });
    }
  },
  component: RegisterPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Create Account | TestingWithEkki',
      description:
        'Create a free TestingWithEkki account to start learning test automation.',
      path: '/register',
      locale,
      noIndex: true,
    });
  },
});

function RegisterPage() {
  const { locale } = useParams({ from: '/$locale/register' });
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  return (
    <AuthPageShell
      eyebrow={t('journey.eyebrow')}
      title={t('journey.title')}
      description={t('journey.description')}
    >
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
        <RegisterForm
          onLoginClick={() => {
            void navigate({
              to: LocaleRoutes.login,
              params: localeParams(locale),
            });
          }}
          // No onSuccess needed as RegisterForm handles the "Check Email" state internally
        />
      </div>
    </AuthPageShell>
  );
}
