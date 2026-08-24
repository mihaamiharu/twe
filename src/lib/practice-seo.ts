import type { ChallengeCatalogDetail } from '@/lib/catalog.types';
import i18n from '@/lib/i18n';
import { BASE_URL, createSeoHead } from '@/lib/seo';

type PracticeSeoChallenge = Pick<
  ChallengeCatalogDetail,
  'slug' | 'title' | 'description' | 'difficulty' | 'category' | 'xpReward'
>;

interface PracticeDetailSeoParams {
  locale: string;
  slug: string;
  challenge?: PracticeSeoChallenge | null;
  noIndex?: boolean | undefined;
}

function translate(key: string, locale: string, fallback: string): string {
  return i18n.t(key, { lng: locale, defaultValue: fallback });
}

export function createPracticeDetailSeoHead({
  locale,
  slug,
  challenge,
  noIndex,
}: PracticeDetailSeoParams) {
  const path = `/practice/${slug}`;
  const fallbackTitle = translate(
    'challenges:page.seo.title',
    locale,
    'Practice challenges | TestingWithEkki',
  );
  const fallbackDescription = translate(
    'challenges:page.seo.description',
    locale,
    'Practice software testing skills with hands-on challenges.',
  );

  if (!challenge) {
    return createSeoHead({
      title: fallbackTitle,
      description: fallbackDescription,
      path,
      locale,
      noIndex: noIndex ?? true,
    });
  }

  const difficulty = translate(
    `challenges:difficulty.${challenge.difficulty}`,
    locale,
    challenge.difficulty,
  );
  const typeLabel = translate(
    'challenges:page.practiceResourceType',
    locale,
    'Practice challenge',
  );
  const category = translate(
    `challenges:categories.${challenge.category}`,
    locale,
    challenge.category,
  );
  const title = `${challenge.title} · ${difficulty} | TestingWithEkki`;
  const url = `${BASE_URL}/${locale}${path}`;
  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(challenge.title)}&type=Challenge&difficulty=${encodeURIComponent(challenge.difficulty)}&xp=${challenge.xpReward}`;
  const homeLabel = translate('common:navigation.home', locale, 'Home');
  const practiceLabel = translate(
    'common:navigation.practice',
    locale,
    'Practice',
  );

  return createSeoHead({
    title,
    description: challenge.description,
    path,
    locale,
    ogImage,
    ogType: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: homeLabel,
            item: `${BASE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: practiceLabel,
            item: `${BASE_URL}/${locale}/practice`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: challenge.title,
            item: url,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: challenge.title,
        description: challenge.description,
        learningResourceType: typeLabel,
        educationalLevel: difficulty,
        teaches: category,
        isAccessibleForFree: true,
        inLanguage: locale,
        url,
        image: ogImage,
        author: {
          '@type': 'Organization',
          name: 'TestingWithEkki',
          url: BASE_URL,
        },
      },
    ],
  });
}
