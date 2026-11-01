import type { D1Database } from '@cloudflare/workers-types';

export interface RuntimeEnv {
  DB: D1Database;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  APP_RUNTIME?: {
    getByName(
      name: string,
      options: { locationHint: 'apac' },
    ): {
      fetch(request: Request): Promise<Response>;
    };
  };
  APP_ENV: 'local' | 'preview' | 'production' | 'test';
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  REQUIRE_EMAIL_VERIFICATION?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  EMAIL_PROVIDER?: 'smtp' | 'http' | 'resend' | 'disabled' | 'unconfigured';
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  EMAIL_HTTP_URL?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAIL?: string;
  DEEPSEEK_API_KEY?: string;
  GH_API_TOKEN?: string;
  GH_OWNER?: string;
  GH_REPO?: string;
  VITE_GA_MEASUREMENT_ID?: string;
  PREVIEW_ACCESS_TOKEN?: string;
  MAINTENANCE_MODE?: string;
  E2E_SECRET?: string;
}
