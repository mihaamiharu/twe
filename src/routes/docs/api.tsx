import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

export const Route = createFileRoute('/docs/api')({
    component: ApiDocsPage,
});

function ApiDocsPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Dynamically load Swagger UI
        const loadSwaggerUI = async () => {
            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
            script.onload = () => {
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
                            // @ts-expect-error - SwaggerUIStandalonePreset is loaded from CDN
                            window.SwaggerUIStandalonePreset,
                        ],
                        layout: 'StandaloneLayout',
                        defaultModelsExpandDepth: 1,
                        defaultModelExpandDepth: 1,
                        docExpansion: 'list',
                        filter: true,
                        showExtensions: true,
                        showCommonExtensions: true,
                    });
                }
            };
            document.body.appendChild(script);
        };

        loadSwaggerUI();

        // Cleanup
        return () => {
            const swaggerCSS = document.querySelector('link[href*="swagger-ui"]');
            const swaggerJS = document.querySelector('script[src*="swagger-ui"]');
            swaggerCSS?.remove();
            swaggerJS?.remove();
        };
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto py-4">
                <div
                    id="swagger-ui"
                    ref={containerRef}
                    className="swagger-ui-container"
                />
            </div>
            <style>{`
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .opblock-tag { font-size: 18px; }
        .swagger-ui .btn { border-radius: 6px; }
        .swagger-ui select { border-radius: 6px; }
        .swagger-ui input { border-radius: 6px; }
        .swagger-ui textarea { border-radius: 6px; }
      `}</style>
        </div>
    );
}
