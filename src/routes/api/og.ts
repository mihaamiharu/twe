import { createFileRoute } from '@tanstack/react-router';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { OgImageTemplate } from '../../components/og-image-template'; // Use relative path
import { HomeOgImageTemplate } from '../../components/home-og-image-template';

let inspectorImageData: string | null = null;

async function loadInspectorImage() {
    if (inspectorImageData) return inspectorImageData;

    // This path is a fixed, bundled asset; it is not derived from request data.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const image = await readFile(
        resolve(process.cwd(), 'public/illustrations/twe-inspector-male-hero.png'),
    );
    inspectorImageData = `data:image/png;base64,${image.toString('base64')}`;
    return inspectorImageData;
}

async function loadGoogleFont(font: string, weight: number) {
    const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}`;
    const css = await fetch(url, {
        headers: {
            // Android UA to force TTF response
            'User-Agent':
                'Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
        },
    }).then((res) => {
        if (!res.ok) throw new Error(`Failed to load font CSS: ${res.status}`);
        return res.text();
    });

    const resource = css.match(/src: url\((.+?)\)/)?.[1];
    if (!resource) throw new Error(`Failed to parse font URL for ${font} ${weight}`);

    return fetch(resource).then((res) => {
        if (!res.ok) throw new Error(`Failed to load font file: ${res.status}`);
        return res.arrayBuffer();
    });
}

export const Route = createFileRoute('/api/og')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url);
                    const title = url.searchParams.get('title') || 'TestingWithEkki';
                    const type = url.searchParams.get('type') || 'Challenge';
                    const difficulty = url.searchParams.get('difficulty');
                    const xp = url.searchParams.get('xp');

                    // Load fonts dynamically from Google Fonts (TTF)
                    console.log(`[OG] Fetching fonts for "${title}"`);

                    const [fontData, fontRegularData] = await Promise.all([
                        loadGoogleFont('Instrument Sans', 700),
                        loadGoogleFont('Instrument Sans', 400)
                    ]);

                    console.log(`[OG] Fonts loaded, generating SVG`);

                    const template = type.toLowerCase() === 'home'
                        ? HomeOgImageTemplate({ inspectorImage: await loadInspectorImage() })
                        : OgImageTemplate({ title, type, difficulty, xp });

                    const svg = await satori(
                        template,
                        {
                            width: 1200,
                            height: 630,
                            fonts: [
                                {
                                    name: 'Instrument Sans',
                                    data: fontData,
                                    weight: 700,
                                    style: 'normal',
                                },
                                {
                                    name: 'Instrument Sans',
                                    data: fontRegularData,
                                    weight: 400,
                                    style: 'normal',
                                },
                            ],
                        }
                    );

                    console.log(`[OG] SVG generated, rendering PNG`);

                    const resvg = new Resvg(svg);
                    const pngData = resvg.render();
                    const pngBuffer = pngData.asPng();

                    const responseBody = Uint8Array.from(pngBuffer).buffer;
                    return new Response(responseBody, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Cache-Control': 'public, max-age=31536000, immutable',
                        },
                    });
                } catch (error) {
                    console.error('[OG] Error generating image:', error);
                    // Fallback: Redirect to static banner image
                    return new Response(null, {
                        status: 302,
                        headers: {
                            'Location': '/twe-banner.png',
                            'Cache-Control': 'no-cache', // Don't cache the redirect itself heavily
                        },
                    });
                }
            }
        }
    }
});
