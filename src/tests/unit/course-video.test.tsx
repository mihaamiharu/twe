import { afterEach, describe, expect, it } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { CourseVideoEmbed } from '@/components/courses/course-video-embed';
import { isAllowedCourseVideoEmbedUrl } from '@/lib/course-video';

const readyVideo = {
  status: 'ready' as const,
  title: 'Requirements analysis',
  durationMinutes: 8,
  focus: 'Turn requirements into test questions.',
};

describe('course video embeds', () => {
  afterEach(cleanup);

  it('accepts only HTTPS YouTube embed URLs', () => {
    expect(
      isAllowedCourseVideoEmbedUrl(
        'https://www.youtube-nocookie.com/embed/abc123_-',
      ),
    ).toBe(true);
    expect(
      isAllowedCourseVideoEmbedUrl('https://www.youtube.com/embed/abc123_-'),
    ).toBe(true);
    expect(
      isAllowedCourseVideoEmbedUrl('http://www.youtube.com/embed/abc123_-'),
    ).toBe(false);
    expect(
      isAllowedCourseVideoEmbedUrl('https://example.com/embed/abc123_-'),
    ).toBe(false);
    expect(
      isAllowedCourseVideoEmbedUrl('https://www.youtube.com/watch?v=abc123_-'),
    ).toBe(false);
  });

  it('renders a safe iframe for a ready approved video', () => {
    render(
      <CourseVideoEmbed
        video={{
          ...readyVideo,
          embedUrl: 'https://www.youtube-nocookie.com/embed/abc123_-',
        }}
        fallbackLabel="Video unavailable"
      />,
    );

    const iframe = screen.getByTestId('course-video-iframe');
    expect(iframe.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/abc123_-',
    );
    expect(iframe.getAttribute('sandbox')).toContain('allow-scripts');
  });

  it('renders a localized fallback for planned or invalid videos', () => {
    const { rerender } = render(
      <CourseVideoEmbed
        video={{ ...readyVideo, status: 'planned' }}
        fallbackLabel="Video unavailable"
      />,
    );

    expect(screen.getByTestId('course-video-fallback').textContent).toContain(
      'Video unavailable',
    );

    rerender(
      <CourseVideoEmbed
        video={{
          ...readyVideo,
          embedUrl: 'https://example.com/embed/abc123_-',
        }}
        fallbackLabel="Video unavailable"
      />,
    );

    expect(screen.getByTestId('course-video-fallback')).toBeTruthy();
    expect(screen.queryByTestId('course-video-iframe')).toBeNull();
  });
});
