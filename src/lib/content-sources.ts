import type { ChallengeTier } from './content.types';

// Keep the active catalog explicit: adding a JSON file must not publish a tier.
export const ACTIVE_CHALLENGE_TIERS: readonly ChallengeTier[] = [
  'basic',
  'beginner',
  'intermediate',
  'e2e',
  'typescript',
];

export const CONTENT_LOCALES = ['en', 'id'] as const;

export interface ContentSourceManifest {
  registry: string;
  tiers: Partial<Record<ChallengeTier, string>>;
  tutorials: Record<string, string>;
}
