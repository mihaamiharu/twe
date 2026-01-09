import { APIRequestContext, BrowserContext, Page } from '@playwright/test';

export async function loginViaApi(context: BrowserContext, request: APIRequestContext) {
    // 1. Optional: Visit a page to initialize any necessary CSRF/State cookies if needed
    // Assuming better-auth requires a state cookie, we might get one from visiting the site or it might work directly.
    // The user provided a CURL with a specific state cookie. If strict, we might need to fetch it.
    // Let's try to just hit the endpoint first.

    // User provided credentials
    const email = 'kikkawa23@gmail.com';
    const password = 'kikkawa23@gmail.com'; // Using password same as email per instruction

    const response = await request.post('http://localhost:3000/api/auth/sign-in/email', {
        headers: {
            'content-type': 'application/json',
            'origin': 'http://localhost:3000',
            'referer': 'http://localhost:3000/en/login',
            // Add other headers if strictly necessary, but usually content-type is enough
        },
        data: {
            email,
            password,
        }
    });

    if (!response.ok()) {
        const text = await response.text();
        throw new Error(`API Login failed: ${response.status()} ${text}`);
    }

    // Capture cookies from the response
    const cookies = response.headers()['set-cookie'];
    if (cookies) {
        // Parse Set-Cookie header(s) and add to context
        // Playwright Request context stores cookies, but we need to put them into the BrowserContext
        // Actually, if we use the *browser context's* request, it might verify cookies automatically?
        // But here we passed `request`.

        // Better approach: Get the storage state or cookies from the API response
        // The API response might return the user object but the essential part is the Set-Cookie header.
        // We can parse it.

        // However, Playwright `context.addCookies` expects explicit objects.
        // A simpler way:
    }

    // Easier way: Use the context's request to ensure cookies are stored in the storage state?
    // No, request context is separate.

    // Let's parse the headers.
    const responseHeaders = response.headersArray();
    const setCookieHeaders = responseHeaders.filter(h => h.name.toLowerCase() === 'set-cookie');

    const cookiesToAdd = setCookieHeaders.map(header => {
        const parts = header.value.split(';')[0].split('=');
        const name = parts[0];
        const value = parts.slice(1).join('=');
        return {
            name,
            value,
            domain: 'localhost',
            path: '/',
        };
    });

    if (cookiesToAdd.length > 0) {
        await context.addCookies(cookiesToAdd);
    } else {
        // If NO cookies returned, maybe we needed to send the 'state' cookie first?
        console.warn('Login success but no cookies received?');
    }

    return response;
}

