import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/theme-provider';

export const Route = createFileRoute('/docs/api')({
  component: ApiDocsPage,
});

function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Dynamically load Swagger UI
    const loadSwaggerUI = () => {
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href =
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
      document.head.appendChild(link);

      // Load standalone preset first
      const presetScript = document.createElement('script');
      presetScript.src =
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
      document.body.appendChild(presetScript);

      // Load main bundle
      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
      script.onload = () => {
        // Wait a bit for standalone preset to be available
        setTimeout(() => {
          // Define types for SwaggerUI on window
          const win = window as unknown as {
            SwaggerUIBundle: ((config: unknown) => void) & {
              presets: { apis: unknown };
              plugins: { DownloadUrl: unknown };
            };
          } & Window;

          if (win.SwaggerUIBundle && containerRef.current) {
            win.SwaggerUIBundle({
              url: '/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [win.SwaggerUIBundle.presets.apis],
              plugins: [win.SwaggerUIBundle.plugins.DownloadUrl],
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

  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'swagger-dark' : ''}`}>
      <div className="max-w-7xl mx-auto py-4 px-4">
        <div
          id="swagger-ui"
          ref={containerRef}
          className="swagger-ui-container"
        />
      </div>
      <style>{`
        /* Light mode styles */
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { font-size: 28px; }
        .swagger-ui .opblock-tag { font-size: 18px; }
        .swagger-ui .btn { border-radius: 6px; }
        .swagger-ui select { border-radius: 6px; }
        .swagger-ui input { border-radius: 6px; }
        .swagger-ui textarea { border-radius: 6px; }
        
        /* Dark mode overrides */
        .swagger-dark {
          background-color: hsl(240 10% 3.9%);
        }
        .swagger-dark .swagger-ui {
          background-color: transparent;
        }
        .swagger-dark .swagger-ui,
        .swagger-dark .swagger-ui .info .title,
        .swagger-dark .swagger-ui .info .base-url,
        .swagger-dark .swagger-ui .info .description p,
        .swagger-dark .swagger-ui .info h1,
        .swagger-dark .swagger-ui .info h2,
        .swagger-dark .swagger-ui .info h3,
        .swagger-dark .swagger-ui .info h4,
        .swagger-dark .swagger-ui .info h5,
        .swagger-dark .swagger-ui .opblock-tag,
        .swagger-dark .swagger-ui .opblock .opblock-summary-description,
        .swagger-dark .swagger-ui .opblock-description-wrapper p,
        .swagger-dark .swagger-ui .response-col_status,
        .swagger-dark .swagger-ui .response-col_description,
        .swagger-dark .swagger-ui table thead tr th,
        .swagger-dark .swagger-ui table thead tr td,
        .swagger-dark .swagger-ui .parameter__name,
        .swagger-dark .swagger-ui .parameter__type,
        .swagger-dark .swagger-ui .model-title,
        .swagger-dark .swagger-ui .model,
        .swagger-dark .swagger-ui .prop-type,
        .swagger-dark .swagger-ui .prop-format,
        .swagger-dark .swagger-ui section.models h4 {
          color: #e2e8f0 !important;
        }
        .swagger-dark .swagger-ui .opblock-tag {
          border-bottom-color: #374151 !important;
        }
        .swagger-dark .swagger-ui .opblock {
          background-color: #1e293b !important;
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui .opblock .opblock-summary {
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui .opblock-body {
          background: #0f172a !important;
        }
        .swagger-dark .swagger-ui .opblock-body pre {
          background: #1e293b !important;
          color: #e2e8f0 !important;
        }
        .swagger-dark .swagger-ui .scheme-container {
          background: #1e293b !important;
          box-shadow: none !important;
        }
        .swagger-dark .swagger-ui .model-box {
          background: #1e293b !important;
        }
        .swagger-dark .swagger-ui section.models {
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui section.models .model-container {
          background: #1e293b !important;
        }
        .swagger-dark .swagger-ui .responses-inner {
          background: #0f172a !important;
        }
        .swagger-dark .swagger-ui table tbody tr td {
          color: #cbd5e1 !important;
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui .btn {
          color: #e2e8f0 !important;
          background: #374151 !important;
          border-color: #4b5563 !important;
        }
        .swagger-dark .swagger-ui .btn:hover {
          background: #4b5563 !important;
        }
        .swagger-dark .swagger-ui select {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui input[type="text"],
        .swagger-dark .swagger-ui textarea {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          border-color: #374151 !important;
        }
        .swagger-dark .swagger-ui .filter-container input {
          background: #1e293b !important;
          color: #e2e8f0 !important;
        }
        .swagger-dark .swagger-ui .servers > label select {
          background: #1e293b !important;
        }
        .swagger-dark .swagger-ui .copy-to-clipboard {
          background: #374151 !important;
        }
        .swagger-dark .swagger-ui .information-container {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
