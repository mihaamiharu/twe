import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AI_ASSISTED_QA_WORKFLOW_COURSE_SLUG } from '@/lib/course-content.types';

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
  component: () => <Outlet />,
});
