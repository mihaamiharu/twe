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
export const TEST_DESIGN_CHECKPOINT_SLUG = '02-test-design' as const;
export const TEST_WRITING_CHECKPOINT_SLUG = '03-test-writing' as const;
export const AUTOMATION_CHECKPOINT_SLUG = '04-automation' as const;
export const EXECUTION_CHECKPOINT_SLUG = '05-execution' as const;
export const TRIAGE_CHECKPOINT_SLUG = '06-triage' as const;
export const QUALITY_SUMMARY_CHECKPOINT_SLUG = '07-quality-summary' as const;

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
    (checkpointSlug === REQUIREMENTS_CHECKPOINT_SLUG ||
      checkpointSlug === TEST_DESIGN_CHECKPOINT_SLUG ||
      checkpointSlug === TEST_WRITING_CHECKPOINT_SLUG ||
      checkpointSlug === AUTOMATION_CHECKPOINT_SLUG ||
      checkpointSlug === EXECUTION_CHECKPOINT_SLUG ||
      checkpointSlug === TRIAGE_CHECKPOINT_SLUG ||
      checkpointSlug === QUALITY_SUMMARY_CHECKPOINT_SLUG)
  );
}

export function getCourseCheckpointSeoMetadata(checkpointSlug: string): {
  title: string;
  description: string;
} {
  if (checkpointSlug === TEST_DESIGN_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 2: AI-Assisted Test Design | TestingWithEkki',
      description:
        'Gunakan AI untuk mengusulkan skenario tes, mengkritik cakupan, dan memprioritaskan pengujian berdasarkan risiko.',
    };
  }

  if (checkpointSlug === TEST_WRITING_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 3: Test Writing | TestingWithEkki',
      description:
        'Ubah skenario prioritas menjadi test case yang jelas, dapat diamati, dan memiliki kandidat otomasi.',
    };
  }

  if (checkpointSlug === AUTOMATION_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 4: Playwright Automation | TestingWithEkki',
      description:
        'Implementasikan test case terpilih dengan Playwright dan TypeScript menggunakan locator, assertion, dan struktur test yang maintainable.',
    };
  }

  if (checkpointSlug === EXECUTION_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 5: Test Execution and Evidence | TestingWithEkki',
      description:
        'Jalankan test Playwright secara lokal, baca hasilnya, dan kumpulkan evidence yang relevan untuk keputusan QA.',
    };
  }

  if (checkpointSlug === TRIAGE_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 6: Failure Triage | TestingWithEkki',
      description:
        'Investigasi failure Playwright dengan evidence, uji hipotesis, dan klasifikasikan penyebab sebagai test, product, environment, atau data issue.',
    };
  }

  if (checkpointSlug === QUALITY_SUMMARY_CHECKPOINT_SLUG) {
    return {
      title: 'Checkpoint 7: Quality Decision and Capstone | TestingWithEkki',
      description:
        'Rangkum area yang diuji dan belum diuji, dokumentasikan evidence, keterbatasan, serta residual risk untuk membuat rekomendasi kualitas berbasis risiko dan menyelesaikan capstone.',
    };
  }

  return {
    title: 'Checkpoint 1: Requirements Analysis | TestingWithEkki',
    description:
      'Analisis requirement, ambiguitas, asumsi, batasan, dan risiko untuk fitur penjadwalan fiktif.',
  };
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
      ...getCourseCheckpointSeoMetadata(params.checkpointSlug),
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
  const { checkpointSlug } = Route.useParams();

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
    (candidate) => candidate.slug === checkpointSlug,
  );

  if (!checkpoint) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="max-w-md space-y-3 text-center">
          <h1 className="text-2xl font-bold">{t('overview.unavailable')}</h1>
          <p className="text-muted-foreground">Checkpoint tidak ditemukan.</p>
        </div>
      </main>
    );
  }

  const course: CourseCheckpointData = {
    manifest: data.data.manifest,
    content: data.data.content,
    checkpoint,
    completed: data.data.completedCheckpointSlugs.includes(checkpoint.slug),
    completedCheckpointSlugs: data.data.completedCheckpointSlugs,
    capstoneCompleted: data.data.capstoneCompleted,
  };

  return <CourseCheckpointPage course={course} locale="id" />;
}
