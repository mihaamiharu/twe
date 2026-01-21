export const getSentryConfig = () => {
  const isClient = typeof window !== 'undefined';

  // Client: specific VITE_ variable (injected at build time)
  // Server: prefer SENTRY_DSN (runtime), fallback to VITE_
  const dsn = isClient
    ? import.meta.env.VITE_SENTRY_DSN
    : (process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN);

  if (!isClient) {
    console.log('[Sentry Config] initializing with DSN:', dsn ? 'FOUND' : 'MISSING');
  }

  return {
    dsn,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: true,
    environment: import.meta.env.MODE || process.env.NODE_ENV || 'development',
  };
};
