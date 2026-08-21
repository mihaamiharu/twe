interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    ADMIN_EMAIL?: string;
    BASE_URL?: string;
    BETTER_AUTH_SECRET?: string;
    BETTER_AUTH_URL?: string;
    BUN_RUN_SKIPPED?: string;
    CI?: string;
    DATABASE_URL?: string;
    DEEPSEEK_API_KEY?: string;
    DIRECT_URL?: string;
    E2E_ADMIN_EMAIL?: string;
    E2E_ADMIN_PASSWORD?: string;
    E2E_APP_PORT?: string;
    E2E_CONTAINER_RUNTIME?: string;
    E2E_DB_PORT?: string;
    E2E_EXTERNAL_SERVER?: string;
    E2E_SECRET?: string;
    GH_API_TOKEN?: string;
    GH_OWNER?: string;
    GH_REPO?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    NODE_ENV?: string;
    PORT?: string;
    REQUIRE_EMAIL_VERIFICATION?: string;
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;
    SMTP_FROM?: string;
    SMTP_HOST?: string;
    SMTP_PASSWORD?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    TEST_DATABASE_URL?: string;
    VITE_APP_URL?: string;
    VITE_GA_MEASUREMENT_ID?: string;
    VITE_APP_VERSION?: string;
    VITE_SENTRY_DSN?: string;
    npm_package_version?: string;
  }
}
