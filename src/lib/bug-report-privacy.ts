/** Keep URL credentials and auth/search/fragment values out of bug context. */
export function sanitizeBugReportPageUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}
