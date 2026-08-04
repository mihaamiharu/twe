const ALLOWED_COURSE_VIDEO_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/**
 * Course videos are authored as explicit HTTPS YouTube embed URLs.
 * Keeping this check separate from rendering prevents arbitrary iframe URLs
 * from entering the course content contract.
 */
export function isAllowedCourseVideoEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const pathParts = url.pathname.split('/').filter(Boolean);

    return (
      url.protocol === 'https:' &&
      ALLOWED_COURSE_VIDEO_HOSTS.has(url.hostname.toLowerCase()) &&
      pathParts.length === 2 &&
      pathParts[0] === 'embed' &&
      /^[A-Za-z0-9_-]{6,64}$/.test(pathParts[1] ?? '') &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
