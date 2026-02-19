import {
  createFileRoute,
  redirect,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { LoginForm } from '@/components/auth';
import type { RootContext } from '../__root';
import { localeParams, LocaleRoutes } from '@/lib/navigation';
import { createSeoHead } from '@/lib/seo';

export const Route = createFileRoute('/$locale/login')({
  beforeLoad: ({ context, params }) => {
    const { auth } = context as RootContext;
    if (auth?.isAuthenticated) {
      throw redirect({
        to: LocaleRoutes.home,
        params: localeParams(params.locale),
      });
    }
  },
  component: LoginPage,
  head: ({ params }) => {
    const locale = params.locale || 'en';
    return createSeoHead({
      title: 'Sign In | TestingWithEkki',
      description: 'Sign in to your TestingWithEkki account to track your progress and earn XP.',
      path: '/login',
      locale,
      noIndex: true,
    });
  },
});



function LoginPage() {
  const { locale } = useParams({ from: '/$locale/login' });
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Redirect to original path if available, otherwise home
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get('redirect');

    if (redirectUrl) {
      void navigate({ to: redirectUrl });
    } else {
      void navigate({ to: LocaleRoutes.home, params: localeParams(locale) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <LoginForm
          onSuccess={handleLoginSuccess}
          onRegisterClick={() => {
            void navigate({
              to: LocaleRoutes.register,
              params: localeParams(locale),
            });
          }}
        />
      </div>
    </div>
  );
}
