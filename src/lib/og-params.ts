export interface OgImageInput {
  title?: string | null;
  type?: string | null;
  difficulty?: string | null;
  xp?: string | number | null;
}

export interface OgImageParams {
  title: string;
  type: string;
  difficulty: string | null;
  xp: string | null;
}

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

function boundedText(value: string, limit: number): string {
  const parts: string[] = [];
  const normalized = value
    .slice(0, 4096)
    .normalize('NFC')
    .replace(/\s+/gu, ' ')
    .trim();
  let units = 0;
  for (const { segment } of graphemes.segment(normalized)) {
    if (
      parts.length === limit ||
      segment.length > 64 ||
      units + segment.length > limit * 8
    )
      return parts.join('') + '…';
    parts.push(segment);
    units += segment.length;
  }
  return parts.join('');
}

export function normalizeOgParams(input: OgImageInput): OgImageParams {
  const type = boundedText(input.type || 'Challenge', 32) || 'Challenge';
  if (type.toLowerCase() === 'home') {
    return {
      title: 'TestingWithEkki',
      type: 'Home',
      difficulty: null,
      xp: null,
    };
  }
  return {
    title:
      boundedText(input.title || 'TestingWithEkki', 200) || 'TestingWithEkki',
    type,
    difficulty: input.difficulty ? boundedText(input.difficulty, 16) : null,
    xp:
      input.xp === undefined || input.xp === null || input.xp === ''
        ? null
        : boundedText(String(input.xp), 12),
  };
}

export function getOgKey(input: OgImageInput): string {
  const params = normalizeOgParams(input);
  return JSON.stringify([
    params.type.toUpperCase(),
    params.title,
    params.difficulty,
    params.xp,
  ]);
}

export function getLegacyOgPath(input: OgImageInput): string {
  const params = normalizeOgParams(input);
  if (params.type === 'Home') return '/api/og?type=Home';
  let path = `/api/og?title=${encodeURIComponent(params.title)}&type=${encodeURIComponent(params.type)}`;
  if (params.difficulty)
    path += `&difficulty=${encodeURIComponent(params.difficulty)}`;
  if (params.xp) path += `&xp=${encodeURIComponent(params.xp)}`;
  return path;
}
