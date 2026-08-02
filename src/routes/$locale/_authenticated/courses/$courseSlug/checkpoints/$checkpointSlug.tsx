import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
  CourseCheckpointPage,
  type CourseCheckpointData,
} from '@/components/courses/course-checkpoint-page';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';
import { createSeoHead } from '@/lib/seo';
import { getCourseOverview } from '@/server/course-progress.fn';

export const REQUIREMENTS_CHECKPOINT_SLUG = '01-requirements' as const;

export const COURSE_CHECKPOINT_ROUTE =
  '/$locale/_authenticated/courses/$courseSlug/checkpoints/$checkpointSlug' as const;

export function isSupportedCourseCheckpointParams(
  locale: string,
  courseSlug: string,
  checkpointSlug: string,
): boolean {
  return (
    locale === 'id' &&
    courseSlug === AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG &&
    checkpointSlug === REQUIREMENTS_CHECKPOINT_SLUG
  );
}

export const Route = createFileRoute(
  '/$locale/_authenticated/courses/$courseSlug/checkpoints/$checkpointSlug',
)({
  loader: ({ params }) => {
    if (
      !isSupportedCourseCheckpointParams(
        params.locale,
        params.courseSlug,
        params.checkpointSlug,
      )
    ) {
      return {
        success: false as const,
        error: 'Course checkpoint is only available in Indonesian',
      };
    }

    return getCourseOverview({
      data: {
        courseSlug: params.courseSlug,
        locale: params.locale,
      },
    });
  },
  component: CourseCheckpointRoute,
  head: ({ params }) =>
    createSeoHead({
      title: 'Checkpoint 1: Requirements Analysis | TestingWithEkki',
      description:
        'Analisis requirement, ambiguitas, asumsi, batasan, dan risiko untuk fitur penjadwalan fiktif.',
      path: `/courses/${params.courseSlug}/checkpoints/${params.checkpointSlug}`,
      locale: params.locale,
      noIndex: !isSupportedCourseCheckpointParams(
        params.locale,
        params.courseSlug,
        params.checkpointSlug,
      ),
    }),
});

function CourseCheckpointRoute() {
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

  const checkpoint = data.data.content.checkpoints.find(
    (candidate) => candidate.slug === REQUIREMENTS_CHECKPOINT_SLUG,
  );

  if (!checkpoint) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">{t('overview.unavailable')}</h1>
          <p className="text-muted-foreground">
            Checkpoint requirements analysis tidak ditemukan.
          </p>
        </div>
      </main>
    );
  }

  const course: CourseCheckpointData = {
    manifest: data.data.manifest,
    content: data.data.content,
    checkpoint,
    completed: data.data.completedCheckpointSlugs.includes(checkpoint.slug),
  };

  return <CourseCheckpointPage course={course} locale="id" />;
}
