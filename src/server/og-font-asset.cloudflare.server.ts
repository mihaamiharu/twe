import { getRuntimeEnv } from '#platform';

export async function readOgFontAsset(path: string): Promise<ArrayBuffer> {
  if (!/^\/og-fonts\/[a-f0-9]{64}\.woff$/.test(path))
    throw new Error('Invalid generated OG font path.');
  const assets = getRuntimeEnv().ASSETS;
  if (!assets) throw new Error('Self-hosted OG fonts are unavailable.');
  const response = await assets.fetch(
    new Request(`https://og-assets.invalid${path}`, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    }),
  );
  if (!response.ok) throw new Error('Self-hosted OG font could not be loaded.');
  return response.arrayBuffer();
}
