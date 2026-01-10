import { APIRequestContext, BrowserContext, Page } from '@playwright/test';

export async function loginViaApi(context: BrowserContext, request: APIRequestContext, page?: Page) {
    const email = 'kikkawa23@gmail.com';
    const password = 'kikkawa23@gmail.com';

    // 1. Visit login page to initialize CSRF/state cookies
    if (page) {
        await page.goto('http://localhost:3000/en/login');
        // Wait for page to be ready
        await page.waitForLoadState('networkidle');
    }

    const requester = page ? page.request : request;
    const response = await requester.post('http://localhost:3000/api/auth/sign-in/email', {
        headers: {
            'content-type': 'application/json',
            'origin': 'http://localhost:3000',
            'referer': 'http://localhost:3000/en/login',
        },
        data: { email, password }
    });

    if (!response.ok()) {
        const text = await response.text();
        throw new Error(`API Login failed: ${response.status()} ${text}`);
    }

    if (!page) {
        // Manual injection if page not available
        const responseHeaders = response.headersArray();
        const setCookieHeaders = responseHeaders.filter(h => h.name.toLowerCase() === 'set-cookie');
        const cookiesToAdd = setCookieHeaders.flatMap(header => {
            const parts = header.value.split(';')[0].split('=');
            if (parts.length < 2) return [];
            return {
                name: parts[0].trim(),
                value: parts.slice(1).join('=').trim(),
                url: 'http://localhost:3000',
                httpOnly: true,
                secure: false,
                sameSite: 'Lax' as const,
            };
        });
        if (cookiesToAdd.length > 0) {
            await context.addCookies(cookiesToAdd);
        }
    } else {
        // Small delay to ensure cookies are processed by the context
        await page.waitForTimeout(500);
    }

    return response;
}
