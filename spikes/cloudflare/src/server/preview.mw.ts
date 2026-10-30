import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

export const previewMiddleware = createMiddleware().server(async ({ next }) => {
  const { getPreviewContext } = await import('./context.server');
  return next({ context: getPreviewContext() });
});

export const syntheticUserMiddleware = createMiddleware()
  .middleware([previewMiddleware])
  .server(async ({ next, context }) => {
    const { getPreviewAuth } = await import('./auth.server');
    const auth = getPreviewAuth(context);
    const session = await auth.api.getSession({ headers: getRequest().headers });
    if (!session || !session.user.email.endsWith('@example.invalid')) {
      throw new Error('Sign in with a synthetic preview user first.');
    }
    return next({ context: { auth, user: session.user } });
  });
