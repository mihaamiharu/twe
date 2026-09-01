import type { TutorialCatalogListItem } from './catalog.types';
import {
  BASE_URL,
  ORGANIZATION_ID,
  PERSON_ID,
  WEBSITE_ID,
  createSeoHead,
} from './seo';
import i18n from './i18n';

type LearnSeoLesson = Pick<
  TutorialCatalogListItem,
  'slug' | 'title' | 'description' | 'estimatedMinutes' | 'tags'
>;

interface LearnSeoOptions {
  lesson: LearnSeoLesson;
  locale: string;
}

const getEducationalLevel = (tags: string[]): string => {
  if (tags.some((tag) => tag.toLowerCase() === 'advanced')) return 'Advanced';
  if (tags.some((tag) => tag.toLowerCase() === 'intermediate')) {
    return 'Intermediate';
  }
  if (tags.some((tag) => tag.toLowerCase() === 'beginner')) return 'Beginner';
  return 'Foundations';
};

export function createLearnDetailSeoHead({ lesson, locale }: LearnSeoOptions) {
  const path = `/learn/${lesson.slug}`;
  const url = `${BASE_URL}/${locale}${path}`;
  const learnUrl = `${BASE_URL}/${locale}/learn`;
  const title = `${lesson.title} | TestingWithEkki`;
  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(lesson.title)}&type=Lesson`;
  const homeLabel = i18n.t('common:navigation.home', { lng: locale });
  const learnLabel = i18n.t('common:navigation.learn', { lng: locale });

  return createSeoHead({
    title,
    description: lesson.description,
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
            name: learnLabel,
            item: learnUrl,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: lesson.title,
            item: url,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: lesson.title,
        description: lesson.description,
        image: ogImage,
        articleSection: learnLabel,
        inLanguage: locale,
        isAccessibleForFree: true,
        author: { '@id': PERSON_ID },
        publisher: { '@id': ORGANIZATION_ID },
        isPartOf: { '@id': WEBSITE_ID },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        '@id': `${url}#learningresource`,
        name: lesson.title,
        description: lesson.description,
        learningResourceType: 'Lesson',
        educationalLevel: getEducationalLevel(lesson.tags),
        timeRequired: `PT${lesson.estimatedMinutes}M`,
        teaches: lesson.tags,
        inLanguage: locale,
        isAccessibleForFree: true,
        url,
        image: ogImage,
        author: { '@id': PERSON_ID },
        publisher: { '@id': ORGANIZATION_ID },
        isPartOf: { '@id': WEBSITE_ID },
      },
    ],
  });
}

/** Generic, non-slug-derived metadata used while a lesson is unavailable. */
export function createLearnFallbackSeoHead({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  return createSeoHead({
    title: i18n.t('tutorials:learn.seo.title', { lng: locale }),
    description: i18n.t('tutorials:learn.seo.description', { lng: locale }),
    path: `/learn/${slug}`,
    locale,
    noIndex: true,
  });
}
