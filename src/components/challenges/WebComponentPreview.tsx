/**
 * WebComponentPreview - Visual preview for selector challenges
 * 
 * Features:
 * - Renders HTML in sandboxed iframe
 * - Highlights target element on hover
 * - Shows element path on click
 * - Live selector highlighting
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, MousePointer2, Target, Maximize2 } from 'lucide-react';

export interface WebComponentPreviewProps {
    htmlContent: string;
    cssContent?: string;
    targetElementId?: string;
    targetSelector?: string;
    userSelector?: string;
    selectorType?: 'css' | 'xpath';
    onElementClick?: (elementPath: string) => void;
    showControls?: boolean;
    height?: string | number;
    className?: string;
}

export function WebComponentPreview({
    htmlContent,
    cssContent,
    targetElementId,
    targetSelector,
    userSelector,
    selectorType = 'css',
    onElementClick,
    showControls = true,
    height = 300,
    className,
}: WebComponentPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [zoom, setZoom] = useState(100);
    const [hoveredElement, setHoveredElement] = useState<string | null>(null);
    const [matchCount, setMatchCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Generate the HTML document for the iframe
    const getIframeContent = useCallback(() => {
        const highlightStyles = `
            .twe-target-highlight {
                outline: 3px solid #22c55e !important;
                outline-offset: 2px;
                background-color: rgba(34, 197, 94, 0.1) !important;
            }
            .twe-user-match {
                outline: 2px dashed #3b82f6 !important;
                outline-offset: 1px;
                background-color: rgba(59, 130, 246, 0.1) !important;
            }
            .twe-hover-highlight {
                outline: 2px solid #f59e0b !important;
                outline-offset: 1px;
                cursor: pointer;
            }
            .twe-no-match {
                outline: 2px solid #ef4444 !important;
            }
            * {
                transition: outline 0.15s ease, background-color 0.15s ease;
            }
        `;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        box-sizing: border-box;
                    }
                    body {
                        margin: 0;
                        padding: 16px;
                        font-family: system-ui, -apple-system, sans-serif;
                        background: #ffffff;
                        color: #1f2937;
                        min-height: 100vh;
                    }
                    ${highlightStyles}
                    ${cssContent || ''}
                </style>
            </head>
            <body>
                ${htmlContent}
                <script>
                    // Message parent about element clicks
                    document.addEventListener('click', (e) => {
                        const path = getElementPath(e.target);
                        window.parent.postMessage({ type: 'elementClick', path }, '*');
                    });

                    // Hover highlighting
                    document.addEventListener('mouseover', (e) => {
                        if (e.target !== document.body) {
                            e.target.classList.add('twe-hover-highlight');
                            const path = getElementPath(e.target);
                            window.parent.postMessage({ type: 'elementHover', path }, '*');
                        }
                    });

                    document.addEventListener('mouseout', (e) => {
                        e.target.classList.remove('twe-hover-highlight');
                        window.parent.postMessage({ type: 'elementHover', path: null }, '*');
                    });

                    function getElementPath(el) {
                        const parts = [];
                        while (el && el !== document.body) {
                            let selector = el.tagName.toLowerCase();
                            if (el.id) {
                                selector += '#' + el.id;
                            } else if (el.className && typeof el.className === 'string') {
                                const classes = el.className.trim().split(/\\s+/).filter(c => !c.startsWith('twe-'));
                                if (classes.length) {
                                    selector += '.' + classes.join('.');
                                }
                            }
                            parts.unshift(selector);
                            el = el.parentElement;
                        }
                        return parts.join(' > ');
                    }

                    // Listen for highlight commands from parent
                    window.addEventListener('message', (e) => {
                        if (e.data.type === 'highlight') {
                            highlightElements(e.data.selector, e.data.selectorType, e.data.className);
                        } else if (e.data.type === 'clearHighlights') {
                            clearHighlights();
                        }
                    });

                    function highlightElements(selector, selectorType, className) {
                        clearHighlights();
                        if (!selector) return;

                        try {
                            let elements = [];
                            if (selectorType === 'css') {
                                elements = document.querySelectorAll(selector);
                            } else {
                                const result = document.evaluate(
                                    selector, 
                                    document, 
                                    null, 
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                    null
                                );
                                for (let i = 0; i < result.snapshotLength; i++) {
                                    elements.push(result.snapshotItem(i));
                                }
                            }

                            elements.forEach(el => {
                                if (el && el.classList) {
                                    el.classList.add(className);
                                }
                            });

                            window.parent.postMessage({ 
                                type: 'matchCount', 
                                count: elements.length 
                            }, '*');
                        } catch (err) {
                            window.parent.postMessage({ 
                                type: 'matchCount', 
                                count: 0,
                                error: err.message 
                            }, '*');
                        }
                    }

                    function clearHighlights() {
                        document.querySelectorAll('.twe-user-match, .twe-target-highlight')
                            .forEach(el => {
                                el.classList.remove('twe-user-match', 'twe-target-highlight');
                            });
                    }

                    // Initial highlight of target element
                    setTimeout(() => {
                        ${targetElementId ? `
                            const target = document.getElementById('${targetElementId}');
                            if (target) target.classList.add('twe-target-highlight');
                        ` : ''}
                        ${targetSelector && !targetElementId ? `
                            highlightElements('${targetSelector}', 'css', 'twe-target-highlight');
                        ` : ''}
                    }, 100);
                </script>
            </body>
            </html>
        `;
    }, [htmlContent, cssContent, targetElementId, targetSelector]);

    // Update iframe content
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(getIframeContent());
            doc.close();
        }
    }, [getIframeContent]);

    // Listen for messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'elementClick') {
                onElementClick?.(event.data.path);
            } else if (event.data.type === 'elementHover') {
                setHoveredElement(event.data.path);
            } else if (event.data.type === 'matchCount') {
                setMatchCount(event.data.count);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onElementClick]);

    // Highlight user's selector matches
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow || !userSelector) return;

        iframe.contentWindow.postMessage({
            type: 'highlight',
            selector: userSelector,
            selectorType,
            className: 'twe-user-match',
        }, '*');

        return () => {
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'clearHighlights' }, '*');
            }
        };
    }, [userSelector, selectorType]);

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
    const handleZoomReset = () => setZoom(100);

    return (
        <div className={cn(
            'border border-border rounded-lg overflow-hidden bg-background',
            isFullscreen && 'fixed inset-4 z-50 border-2',
            className
        )}>
            {/* Toolbar */}
            {showControls && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Preview</span>
                        {targetElementId && (
                            <Badge variant="outline" className="gap-1">
                                <Target className="h-3 w-3" />
                                Target: #{targetElementId}
                            </Badge>
                        )}
                        {userSelector && (
                            <Badge
                                variant={matchCount > 0 ? 'default' : 'destructive'}
                                className="gap-1"
                            >
                                {matchCount} match{matchCount !== 1 ? 'es' : ''}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 50}
                            className="h-7 w-7 p-0"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground w-12 text-center">
                            {zoom}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 200}
                            className="h-7 w-7 p-0"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomReset}
                            className="h-7 w-7 p-0"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="h-7 w-7 p-0"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Preview Container */}
            <div
                className="overflow-auto bg-white"
                style={{ height: isFullscreen ? 'calc(100% - 45px)' : height }}
            >
                <div
                    style={{
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top left',
                        width: `${10000 / zoom}%`,
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        title="Component Preview"
                        sandbox="allow-scripts"
                        className="w-full border-0"
                        style={{
                            minHeight: typeof height === 'number' ? height : 300,
                            pointerEvents: 'auto',
                        }}
                    />
                </div>
            </div>

            {/* Hovered Element Path */}
            {hoveredElement && (
                <div className="px-3 py-1.5 border-t border-border bg-muted/50">
                    <code className="text-xs text-muted-foreground font-mono">
                        {hoveredElement}
                    </code>
                </div>
            )}

            {/* Fullscreen overlay close */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/50 -z-10"
                    onClick={() => setIsFullscreen(false)}
                />
            )}
        </div>
    );
}

export default WebComponentPreview;
