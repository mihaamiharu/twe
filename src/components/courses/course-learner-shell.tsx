import type { ReactNode } from 'react';
import type {
  CourseContentDocument,
  CourseManifest,
} from '@/lib/course-content.types';
import { CourseContents } from '@/components/courses/course-contents';

interface CourseLearnerShellProps {
  manifest: CourseManifest;
  content: CourseContentDocument;
  locale: 'id';
  completedCheckpointSlugs?: readonly string[];
  capstoneCompleted?: boolean;
  currentCheckpointSlug?: string;
  dataTestId: string;
  children: ReactNode;
}

export function CourseLearnerShell({
  manifest,
  content,
  locale,
  completedCheckpointSlugs = [],
  capstoneCompleted = false,
  currentCheckpointSlug,
  dataTestId,
  children,
}: CourseLearnerShellProps) {
  return (
    <main
      className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12"
      data-testid={dataTestId}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <CourseContents
          manifest={manifest}
          content={content}
          locale={locale}
          completedCheckpointSlugs={completedCheckpointSlugs}
          capstoneCompleted={capstoneCompleted}
          currentCheckpointSlug={currentCheckpointSlug}
          mode="mobile"
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <CourseContents
                manifest={manifest}
                content={content}
                locale={locale}
                completedCheckpointSlugs={completedCheckpointSlugs}
                capstoneCompleted={capstoneCompleted}
                currentCheckpointSlug={currentCheckpointSlug}
                mode="desktop"
              />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
