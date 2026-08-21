import type { APIRequestContext, BrowserContext, Page } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export function getE2EAdminCredentials(): {
  email: string;
  password: string;
} {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set by the disposable E2E runner before an admin test runs.',
    );
  }

  return { email, password };
}

export async function loginViaApi(
  context: BrowserContext,
  request: APIRequestContext,
  page?: Page,
  email?: string,
  password?: string,
) {
  const usesDisposableUser = email === undefined && password === undefined;
  const userSuffix = crypto.randomUUID();
  const resolvedEmail = usesDisposableUser
    ? `kikkawa23+${userSuffix}@example.com`
    : email || 'kikkawa23@gmail.com';
  const resolvedPassword = usesDisposableUser
    ? `e2e-password-${userSuffix}`
    : password || 'kikkawa23@gmail.com';

  const requester = page ? page.request : request;

  // Default authenticated tests mutate progress. Give each test its own
  // disposable account so parallel tests cannot change each other's state.
  if (usesDisposableUser && process.env.E2E_SECRET) {
    const seedResponse = await requester.post(`${baseURL}/api/test/seed-user`, {
      headers: {
        'content-type': 'application/json',
        'x-e2e-secret': process.env.E2E_SECRET,
      },
      data: {
        email: resolvedEmail,
        password: resolvedPassword,
        name: 'kikkawa23',
      },
    });

    if (!seedResponse.ok()) {
      const text = await seedResponse.text();
      throw new Error(`E2E user seed failed: ${seedResponse.status()} ${text}`);
    }
  }

  if (page) {
    await page.goto(`${baseURL}/en/login`);
    await page.waitForLoadState('networkidle');
  }

  const response = await requester.post(`${baseURL}/api/auth/sign-in/email`, {
    headers: {
      'content-type': 'application/json',
      origin: baseURL,
      referer: `${baseURL}/en/login`,
    },
    data: { email: resolvedEmail, password: resolvedPassword },
  });

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`API Login failed: ${response.status()} ${text}`);
  }

  if (!page) {
    const responseHeaders = response.headersArray();
    const setCookieHeaders = responseHeaders.filter(
      (h) => h.name.toLowerCase() === 'set-cookie',
    );
    const cookiesToAdd = setCookieHeaders.flatMap((header) => {
      const parts = header.value.split(';')[0].split('=');
      if (parts.length < 2) return [];
      return {
        name: parts[0].trim(),
        value: parts.slice(1).join('=').trim(),
        url: baseURL,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      };
    });
    if (cookiesToAdd.length > 0) {
      await context.addCookies(cookiesToAdd);
    }
  }

  return response;
}
