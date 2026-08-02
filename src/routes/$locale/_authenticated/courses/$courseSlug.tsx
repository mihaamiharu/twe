import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CourseOverviewPage } from '@/components/courses/course-overview-page';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { createSeoHead } from '@/lib/seo';
import { getCourseOverview } from '@/server/course-progress.fn';

export const COURSE_OVERVIEW_ROUTE =
  '/$locale/_authenticated/courses/$courseSlug' as const;

export function isSupportedCourseOverviewParams(
  locale: string,
  courseSlug: string,
): boolean {
  return locale === 'id' && courseSlug === AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG;
}

export const Route = createFileRoute(
  '/$locale/_authenticated/courses/$courseSlug',
)({
  loader: ({ params }) => {
    if (!isSupportedCourseOverviewParams(params.locale, params.courseSlug)) {
      return {
        success: false as const,
        error: 'Course is only available in Indonesian',
      };
    }

    return getCourseOverview({
      data: {
        courseSlug: params.courseSlug,
        locale: params.locale,
      },
    });
  },
  component: CourseOverviewRoute,
  head: ({ params }) =>
    createSeoHead({
      title: 'AI-Assisted QA Workflow | TestingWithEkki',
      description:
        'Workflow QA praktis dari requirement sampai keputusan kualitas dengan bantuan AI dan Playwright.',
      path: `/courses/${params.courseSlug}`,
      locale: params.locale,
      noIndex:
        params.locale !== 'id' ||
        params.courseSlug !== AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
    }),
});

function CourseOverviewRoute() {
  const { t } = useTranslation('courses');
  const data = Route.useLoaderData();

  if (!data.success || !data.data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">{t('overview.unavailable')}</h1>
          <p className="text-muted-foreground">{data.error}</p>
        </div>
      </main>
    );
  }

  return <CourseOverviewPage course={data.data} locale="id" />;
}
