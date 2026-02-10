import { createFileRoute } from '@tanstack/react-router';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { OgImageTemplate } from '../../components/OgImageTemplate'; // Use relative path

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute('/api/og' as any)({
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
                        loadGoogleFont('Outfit', 700),
                        loadGoogleFont('Outfit', 400)
                    ]);

                    console.log(`[OG] Fonts loaded, generating SVG`);

                    const svg = await satori(
                        OgImageTemplate({ title, type, difficulty, xp }),
                        {
                            width: 1200,
                            height: 630,
                            fonts: [
                                {
                                    name: 'Outfit',
                                    data: fontData,
                                    weight: 700,
                                    style: 'normal',
                                },
                                {
                                    name: 'Outfit',
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

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                    return new Response(pngBuffer as any, {
                        headers: {
                            'Content-Type': 'image/png',
                            'Cache-Control': 'public, max-age=31536000, immutable',
                        },
                    });
                } catch (error) {
                    console.error('[OG] Error generating image:', error);
                    // Fallback to text error or default image redirect?
                    // For now, return JSON error for debugging
                    return new Response(JSON.stringify({ error: 'Failed to generate image', details: String(error) }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }
        }
    }
});
