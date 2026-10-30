export interface SpikeBindings {
  DB: D1Database;
  ASSETS: Fetcher;
  DEPLOYMENT_ENV: 'local' | 'preview';
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET?: string;
  SPIKE_ACCESS_TOKEN?: string;
}
