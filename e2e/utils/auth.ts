import { APIRequestContext, BrowserContext, Page } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

export async function loginViaApi(
  context: BrowserContext,
  request: APIRequestContext,
  page?: Page,
  email: string = 'kikkawa23@gmail.com',
  password: string = 'kikkawa23@gmail.com',
) {
  if (page) {
    await page.goto(`${baseURL}/en/login`);
    await page.waitForLoadState('networkidle');
  }

  const requester = page ? page.request : request;
  const response = await requester.post(`${baseURL}/api/auth/sign-in/email`, {
    headers: {
      'content-type': 'application/json',
      origin: baseURL,
      referer: `${baseURL}/en/login`,
    },
    data: { email, password },
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
  } else {
    await page.waitForTimeout(500);
  }

  return response;
}
