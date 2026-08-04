import type { CourseVideoOutline } from '@/lib/course-content.types';
import { isAllowedCourseVideoEmbedUrl } from '@/lib/course-video';

interface CourseVideoEmbedProps {
  video: CourseVideoOutline;
  fallbackLabel: string;
}

export function CourseVideoEmbed({
  video,
  fallbackLabel,
}: CourseVideoEmbedProps) {
  const canEmbed =
    video.status === 'ready' &&
    Boolean(video.embedUrl) &&
    isAllowedCourseVideoEmbedUrl(video.embedUrl ?? '');

  if (!canEmbed) {
    return (
      <div
        className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm leading-6 text-muted-foreground"
        data-testid="course-video-fallback"
        data-video-status={video.status}
        role="status"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-black shadow-sm"
      data-testid="course-video-embed"
    >
      <iframe
        className="aspect-video w-full"
        data-testid="course-video-iframe"
        src={video.embedUrl}
        title={video.title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
}
