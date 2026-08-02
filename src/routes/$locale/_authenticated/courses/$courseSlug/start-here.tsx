import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CourseStartHerePage } from '@/components/courses/course-start-here-page';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { createSeoHead } from '@/lib/seo';
import { getCourseOverview } from '@/server/course-progress.fn';

export const COURSE_START_HERE_ROUTE =
  '/$locale/_authenticated/courses/$courseSlug/start-here' as const;

export function isSupportedCourseStartHereParams(
  locale: string,
  courseSlug: string,
): boolean {
  return locale === 'id' && courseSlug === AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG;
}

export const Route = createFileRoute(
  '/$locale/_authenticated/courses/$courseSlug/start-here',
)({
  loader: ({ params }) => {
    if (!isSupportedCourseStartHereParams(params.locale, params.courseSlug)) {
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
  component: CourseStartHereRoute,
  head: ({ params }) =>
    createSeoHead({
      title: 'Mulai di sini | AI-Assisted QA Workflow | TestingWithEkki',
      description:
        'Panduan setup lokal Node.js, npm, Playwright, repository pendamping, dan smoke test pertama.',
      path: `/courses/${params.courseSlug}/start-here`,
      locale: params.locale,
      noIndex:
        params.locale !== 'id' ||
        params.courseSlug !== AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG,
    }),
});

function CourseStartHereRoute() {
  const { t } = useTranslation('courses');
  const data = Route.useLoaderData();

  if (!data.success || !data.data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">{t('overview.unavailable')}</h1>
          <p className="text-muted-foreground">
            Course ini hanya tersedia dalam bahasa Indonesia.
          </p>
        </div>
      </main>
    );
  }

  return <CourseStartHerePage course={data.data} locale="id" />;
}
