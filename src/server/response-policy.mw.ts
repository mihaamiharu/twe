import { createMiddleware } from '@tanstack/react-start';

/** Public document routes contain no session-dependent React shell. */
function isPublicDocument(pathname: string, response: Response) {
  if (response.status !== 200 || response.headers.has('set-cookie'))
    return false;
  const contentType = response.headers.get('content-type') ?? '';
  return (
    (pathname === '/robots.txt' && contentType.startsWith('text/plain')) ||
    (pathname === '/sitemap.xml' && contentType.includes('xml')) ||
    (pathname === '/api/og' && contentType.startsWith('image/png'))
  );
}

export const responsePolicyMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ request, pathname, next }) => {
  const result = await next();
  const response = result.response;
  const headers = new Headers(response.headers);

  // The root loader/header personalize public HTML as well as private pages.
  // Default dynamic responses (including auth redirects and server functions)
  // to private until an explicitly anonymous prerender strategy is introduced.
  if (!isPublicDocument(pathname, response)) {
    headers.set('Cache-Control', 'private, no-store');
    const vary = headers.get('Vary');
    if (
      !vary
        ?.split(',')
        .some((value) => ['cookie', '*'].includes(value.trim().toLowerCase()))
    ) {
      headers.set('Vary', vary ? `${vary}, Cookie` : 'Cookie');
    }
  }

  const hostname = new URL(request.url).hostname;
  if (hostname.startsWith('qa.') || hostname.endsWith('.workers.dev')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return {
    ...result,
    response: new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  };
});
