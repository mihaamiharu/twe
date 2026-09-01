const PORT = process.env.PORT || 3000;

import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import * as Sentry from "@sentry/bun";
import { getSentryConfig } from "../src/lib/sentry.config";

type StartServer = { fetch(request: Request): Promise<Response> };
type CompressionEncoding = 'br' | 'gzip';

const COMPRESSIBLE_CONTENT_TYPES = new Set([
    'application/javascript',
    'application/json',
    'application/manifest+json',
    'application/xml',
    'image/svg+xml',
    'text/css',
    'text/html',
    'text/javascript',
    'text/plain',
    'text/xml',
]);
const MIN_COMPRESSIBLE_BYTES = 1024;
const STATIC_COMPRESSION_CACHE = new Map<string, {
    sourceBytes: number;
    body: Uint8Array;
}>();

function getEncodingQuality(acceptEncoding: string, encoding: CompressionEncoding): number {
    const entries = acceptEncoding.toLowerCase().split(',').map((entry) => entry.trim());
    const matchingEntry = entries.find((entry) => (entry.split(';', 1)[0] ?? '').trim() === encoding);
    const wildcardEntry = entries.find((entry) => (entry.split(';', 1)[0] ?? '').trim() === '*');
    const entry = matchingEntry ?? wildcardEntry;

    if (!entry) {
        return 0;
    }

    const quality = entry.match(/(?:^|;)\s*q=([0-9.]+)/)?.[1];
    const parsedQuality = quality === undefined ? 1 : Number(quality);
    return Number.isFinite(parsedQuality) ? parsedQuality : 0;
}

function getPreferredCompressionEncoding(request: Request): CompressionEncoding | null {
    if (request.method !== 'GET') {
        return null;
    }

    const acceptEncoding = request.headers.get('accept-encoding') || '';
    const brotliQuality = getEncodingQuality(acceptEncoding, 'br');
    const gzipQuality = getEncodingQuality(acceptEncoding, 'gzip');

    if (brotliQuality <= 0 && gzipQuality <= 0) {
        return null;
    }

    return brotliQuality >= gzipQuality && brotliQuality > 0 ? 'br' : 'gzip';
}

function isCompressible(response: Response): boolean {
    if (!response.body || response.status === 204 || response.status === 304) {
        return false;
    }

    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
    return contentType ? COMPRESSIBLE_CONTENT_TYPES.has(contentType) : false;
}

function appendVary(headers: Headers, value: string): void {
    const vary = headers.get('vary');
    if (!vary) {
        headers.set('vary', value);
        return;
    }

    if (!vary.toLowerCase().split(',').some((item) => item.trim() === value.toLowerCase())) {
        headers.set('vary', `${vary}, ${value}`);
    }
}

function compressBody(sourceBody: Uint8Array, encoding: CompressionEncoding, cacheKey?: string): Uint8Array {
    const sourceBytes = sourceBody.byteLength;
    const cacheEntry = cacheKey ? STATIC_COMPRESSION_CACHE.get(`${cacheKey}:${encoding}`) : undefined;
    if (cacheEntry?.sourceBytes === sourceBytes) {
        return cacheEntry.body;
    }

    const compressedBody = encoding === 'br'
        ? brotliCompressSync(sourceBody, {
            params: {
                [constants.BROTLI_PARAM_QUALITY]: 5,
            },
        })
        : gzipSync(sourceBody, { level: 6 });

    if (cacheKey) {
        STATIC_COMPRESSION_CACHE.set(`${cacheKey}:${encoding}`, {
            sourceBytes,
            body: compressedBody,
        });
    }

    return compressedBody;
}

function toArrayBuffer(body: Uint8Array): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(body.byteLength);
    new Uint8Array(arrayBuffer).set(body);
    return arrayBuffer;
}

function compressStaticResponse(
    response: Response,
    sourceBody: ArrayBuffer,
    request: Request,
    cacheKey: string,
): Response {
    if (!isCompressible(response) || response.headers.has('content-encoding')) {
        return response;
    }

    const encoding = getPreferredCompressionEncoding(request);
    if (!encoding || sourceBody.byteLength < MIN_COMPRESSIBLE_BYTES) {
        return response;
    }

    const compressedBody = compressBody(new Uint8Array(sourceBody), encoding, cacheKey);
    const headers = new Headers(response.headers);
    headers.set('content-encoding', encoding);
    headers.set('content-length', String(compressedBody.byteLength));
    appendVary(headers, 'Accept-Encoding');

    return new Response(toArrayBuffer(compressedBody), {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function maybeCompressResponse(response: Response, request: Request): Response {
    if (!isCompressible(response) || response.headers.has('content-encoding')) {
        return response;
    }

    const acceptEncoding = request.headers.get('accept-encoding') || '';
    if (getEncodingQuality(acceptEncoding, 'gzip') <= 0) {
        return response;
    }

    const compressedBody = response.body!.pipeThrough(new CompressionStream('gzip'));
    const headers = new Headers(response.headers);
    headers.set('content-encoding', 'gzip');
    headers.delete('content-length');
    appendVary(headers, 'Accept-Encoding');

    return new Response(compressedBody, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

function isStartServer(value: unknown): value is StartServer {
    return (
        typeof value === 'object' &&
        value !== null &&
        'fetch' in value &&
        typeof value.fetch === 'function'
    );
}

const serverModulePath = '../dist/server/server.js';
const serverModule: unknown = await import(serverModulePath);
if (
    typeof serverModule !== 'object' ||
    serverModule === null ||
    !('default' in serverModule) ||
    !isStartServer(serverModule.default)
) {
    throw new TypeError('Built server module does not expose a compatible default handler');
}
const server = serverModule.default;

Sentry.init(getSentryConfig());

const env = process.env.NODE_ENV || 'development';
console.log(`🚀 ${env.charAt(0).toUpperCase() + env.slice(1)} server starting on port ${PORT}...`);

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const path = url.pathname;

        // Security: basic directory traversal protection
        if (path.includes('..')) {
            return new Response('Not Found', { status: 404 });
        }

        // Static assets from dist/client
        // We only serve files if they aren't the root path (SSR handles /)
        // and if they actually exist in the client dist folder.
        if (path !== '/') {
            const filePath = `./dist/client${path}`;
            const file = Bun.file(filePath);
            if (await file.exists()) {
                const sourceBody = await file.arrayBuffer();
                const response = new Response(sourceBody);
                response.headers.set('Content-Type', file.type);

                // Cache Control
                if (path.startsWith('/assets/')) {
                    // Immutable assets (hashed by Vite) - 1 year
                    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
                } else {
                    // Other static files (favicon, robots.txt, etc) - 1 hour
                    response.headers.set('Cache-Control', 'public, max-age=3600');
                }

                return compressStaticResponse(response, sourceBody, req, filePath);
            }
        }

        // SSR fallback to TanStack Start handler
        try {
            const response = await server.fetch(req);
            const host = req.headers.get('host');

            let finalResponse = response;
            if (host?.startsWith('qa.')) {
                // For QA subdomain, ensure no indexing
                // We create a new response to add headers without potentially locking the original stream
                const newHeaders = new Headers(response.headers);
                newHeaders.set('X-Robots-Tag', 'noindex, nofollow');
                
                finalResponse = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders,
                });
            }

            return maybeCompressResponse(finalResponse, req);
        } catch (error) {
            Sentry.captureException(error);
            console.error('SSR Error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
});
