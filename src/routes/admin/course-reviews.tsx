import { createFileRoute } from '@tanstack/react-router';
import { CourseReviewWorkspace } from '@/components/admin/course-review-workspace';

export const Route = createFileRoute('/admin/course-reviews')({
  component: CourseReviewWorkspace,
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
      { title: 'Course Review Workspace | TestingWithEkki' },
    ],
  }),
});
