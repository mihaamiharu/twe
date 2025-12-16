import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export const Route = createFileRoute('/docs/api')({
    component: ApiDocsPage,
});

function ApiDocsPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Dynamically load Swagger UI
        const loadSwaggerUI = async () => {
            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
            document.head.appendChild(link);

            // Load standalone preset first
            const presetScript = document.createElement('script');
            presetScript.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
            document.body.appendChild(presetScript);

            // Load main bundle
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
            script.onload = () => {
                // Wait a bit for standalone preset to be available
                setTimeout(() => {
                    // @ts-expect-error - SwaggerUIBundle is loaded from CDN
                    if (window.SwaggerUIBundle && containerRef.current) {
                        // @ts-expect-error - SwaggerUIBundle is loaded from CDN
                        window.SwaggerUIBundle({
                            url: '/openapi.json',
                            dom_id: '#swagger-ui',
                            deepLinking: true,
                            presets: [
                                // @ts-expect-error - SwaggerUIBundle is loaded from CDN
                                window.SwaggerUIBundle.presets.apis,
                            ],
                            plugins: [
                                // @ts-expect-error - SwaggerUIBundle is loaded from CDN
                                window.SwaggerUIBundle.plugins.DownloadUrl,
                            ],
                            defaultModelsExpandDepth: 1,
                            defaultModelExpandDepth: 1,
                            docExpansion: 'list',
                            filter: true,
                            showExtensions: true,
                            showCommonExtensions: true,
                        });
                    }
                }, 100);
            };
            document.body.appendChild(script);
        };

        loadSwaggerUI();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto py-4 px-4">
                <div
                    id="swagger-ui"
                    ref={containerRef}
                    className="swagger-ui-container"
                />
            </div>
            <style>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { font-size: 28px; }
        .swagger-ui .opblock-tag { font-size: 18px; }
        .swagger-ui .btn { border-radius: 6px; }
        .swagger-ui select { border-radius: 6px; }
        .swagger-ui input { border-radius: 6px; }
        .swagger-ui textarea { border-radius: 6px; }
        .swagger-ui .scheme-container { background: #f8f8f8; padding: 16px; }
      `}</style>
        </div>
    );
}
