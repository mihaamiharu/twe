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

export function normalizeOgParams(input: OgImageInput): OgImageParams {
  const type = input.type || 'Challenge';
  if (type.toLowerCase() === 'home') {
    return {
      title: 'TestingWithEkki',
      type: 'Home',
      difficulty: null,
      xp: null,
    };
  }
  return {
    title: input.title || 'TestingWithEkki',
    type,
    difficulty: input.difficulty || null,
    xp:
      input.xp === undefined || input.xp === null || input.xp === ''
        ? null
        : String(input.xp),
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
