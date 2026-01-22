export const getSentryConfig = () => {
  const isClient = typeof window !== 'undefined';

  // Client: specific VITE_ variable (injected at build time)
  // Server: prefer SENTRY_DSN (runtime), fallback to VITE_
  const dsn = isClient
    ? import.meta.env.VITE_SENTRY_DSN
    : (process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN);

  return {
    dsn,
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || process.env.SENTRY_ENVIRONMENT || import.meta.env.MODE || process.env.NODE_ENV || 'development',
    release: import.meta.env.VITE_APP_VERSION || process.env.npm_package_version || '1.0.0',
  };
};
