export function getLocalizedString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value !== 'object' || value === null || !('en' in value)) {
    return fallback;
  }

  return typeof value.en === 'string' ? value.en : fallback;
}
