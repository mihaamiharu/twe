import { useState, useEffect, useCallback } from 'react';
import { HIGHLIGHT_STYLES, INJECTED_SCRIPTS } from './constants';
import type {
    WebComponentPreviewProps,
    ViewMode,
    PreviewState,
    SelectorType
} from './types';

export function usePreviewState(
    props: WebComponentPreviewProps,
    iframeRef: React.RefObject<HTMLIFrameElement | null>
) {
    const {
        htmlContent,
        cssContent,
        targetElementId,
        targetSelector,
        userSelector,
        selectorType = 'css',
        onElementClick,
        onValidationChange,
        onNavigate,
        targetSelectorType = 'css',
    } = props;

    const [zoom, setZoom] = useState(100);
    const [hoveredElement, setHoveredElement] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('preview');

    // Generate the full HTML document for the iframe
    const getFullIframeDocument = useCallback(() => {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 16px;
            font-family: 'Outfit', system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #1f2937;
            min-height: 100vh;
          }
          ${HIGHLIGHT_STYLES}
          ${cssContent || ''}
        </style>
      </head>
      <body>
        ${htmlContent}
        <script>${INJECTED_SCRIPTS}</script>
        <script>
          // Initial highlight of target element
          setTimeout(() => {
            ${targetElementId
                ? `
                const target = document.getElementById('${targetElementId}');
                if (target) target.classList.add('twe-target-highlight');
              `
                : ''
            }
            ${targetSelector && !targetElementId
                ? `highlightElements('${targetSelector}', 'css', 'twe-target-highlight');`
                : ''
            }
          }, 100);
        </script>
      </body>
      </html>
    `;
    }, [htmlContent, cssContent, targetElementId, targetSelector]);

    // Effect: Update iframe content when HTML/CSS or viewMode changes
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || viewMode !== 'preview') return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(getFullIframeDocument());
            doc.close();
        }
    }, [getFullIframeDocument, viewMode, iframeRef]);

    // Effect: Listen for messages from the iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;

            switch (data.type) {
                case 'elementClick':
                    onElementClick?.(data.path);
                    break;
                case 'elementHover':
                    setHoveredElement(data.path);
                    break;
                case 'validationResult':
                    onValidationChange?.({
                        isValid: data.isValid,
                        matchCount: data.matchCount,
                    });
                    break;
                case 'vfsNavigate':
                    onNavigate?.(data.path);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onElementClick, onValidationChange, onNavigate]);

    // Effect: Highlight user's selector matches
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow || !userSelector || viewMode !== 'preview') return;

        iframe.contentWindow.postMessage(
            {
                type: 'highlight',
                selector: userSelector,
                selectorType,
                className: 'twe-user-match',
                targetSelector,
                targetSelectorType,
            },
            '*',
        );

        return () => {
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'clearHighlights' }, '*');
            }
        };
    }, [userSelector, selectorType, viewMode, targetSelector, targetSelectorType, iframeRef]);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

    return {
        zoom,
        setZoom,
        hoveredElement,
        viewMode,
        setViewMode,
        isFullscreen,
        setIsFullscreen,
        handleZoomIn,
        handleZoomOut,
    };
}
