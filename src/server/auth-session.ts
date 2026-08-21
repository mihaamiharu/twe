import { omitUndefined } from '@/lib/omit-undefined';

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  role: string | null;
};

export type AuthSession = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  gaMeasurementId?: string;
};

export function buildAuthSession(
  user: SessionUser | null,
  gaMeasurementId: string | undefined,
): AuthSession {
  return {
    user,
    isAuthenticated: user !== null,
    ...omitUndefined({ gaMeasurementId }),
  };
}
