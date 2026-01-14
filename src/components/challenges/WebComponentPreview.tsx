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
import { CodeEditor } from './CodeEditor';
import { Lock, Eye, Code2, Minus, Plus, MousePointerClick } from 'lucide-react';

export interface WebComponentPreviewProps {
  htmlContent: string;
  cssContent?: string;
  targetElementId?: string;
  targetSelector?: string;
  userSelector?: string;
  selectorType?: 'css' | 'xpath';
  targetSelectorType?: 'css' | 'xpath';
  onElementClick?: (elementPath: string) => void;
  onValidationChange?: (result: {
    isValid: boolean;
    matchCount: number;
  }) => void;
  showControls?: boolean;
  height?: string | number;
  className?: string;
  /** Expose iframe ref for external access (e.g., for code execution) */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export function WebComponentPreview({
  htmlContent,
  cssContent,
  targetElementId,
  targetSelector,
  userSelector,
  selectorType = 'css',
  onElementClick,
  onValidationChange,
  showControls = true,
  // height prop is reserved for future use
  className,
  iframeRef: externalIframeRef,
  ...props
}: WebComponentPreviewProps) {
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;
  const [zoom, setZoom] = useState(100);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  // Generate the HTML document for the iframe
  const getIframeContent = useCallback(() => {
    const highlightStyles = `
            .twe-target-highlight {
                outline: 3px solid #22c55e !important;
                outline-offset: 2px;
                box-shadow: inset 0 0 0 1000px rgba(34, 197, 94, 0.1) !important;
            }
            .twe-user-match {
                outline: 2px dashed #3b82f6 !important;
                outline-offset: 1px;
                box-shadow: inset 0 0 0 1000px rgba(59, 130, 246, 0.1) !important;
            }
            .twe-hover-highlight {
                outline: 2px solid #f59e0b !important;
                outline-offset: 1px;
                cursor: pointer;
            }
            .twe-no-match {
                outline: 2px solid #ef4444 !important;
            }
            
            /* Base Styles for Challenges */
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 1rem 0;
                font-size: 0.9em;
            }
            th, td {
                border: 1px solid #e5e7eb;
                padding: 0.5rem 0.75rem;
                text-align: left;
            }
            th {
                background-color: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            /* Dark mode support for tables */
            @media (prefers-color-scheme: dark) {
                th, td {
                    border-color: #374151;
                }
                th {
                    background-color: #1f2937;
                    color: #f3f4f6;
                }
            }
            
            .grid {
                display: grid;
                gap: 1rem;
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
                            highlightElements(
                                e.data.selector, 
                                e.data.selectorType, 
                                e.data.className,
                                e.data.targetSelector,
                                e.data.targetSelectorType
                            );
                        } else if (e.data.type === 'clearHighlights') {
                            clearHighlights();
                        }
                    });

                    function highlightElements(selector, selectorType, className, targetSelector, targetSelectorType) {
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

                            // Validation Logic
                            if (targetSelector) {
                                let targetElements = [];
                                try {
                                    if (targetSelectorType === 'css') {
                                        targetElements = Array.from(document.querySelectorAll(targetSelector));
                                    } else {
                                        const result = document.evaluate(
                                            targetSelector, 
                                            document, 
                                            null, 
                                            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
                                            null
                                        );
                                        for (let i = 0; i < result.snapshotLength; i++) {
                                            targetElements.push(result.snapshotItem(i));
                                        }
                                    }

                                    // Compare sets
                                    const userSet = new Set(Array.from(elements));
                                    const targetSet = new Set(targetElements);
                                    
                                    const isValid = userSet.size === targetSet.size && 
                                                    [...userSet].every(x => targetSet.has(x));
                                    
                                    window.parent.postMessage({
                                        type: 'validationResult',
                                        isValid,
                                        matchCount: elements.length || 0
                                    }, '*');

                                } catch (err) {
                                    console.error('Validation error:', err);
                                }
                            }

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
                        ${targetElementId
        ? `
                            const target = document.getElementById('${targetElementId}');
                            if (target) target.classList.add('twe-target-highlight');
                        `
        : ''
      }
                        ${targetSelector && !targetElementId
        ? `
                            highlightElements('${targetSelector}', 'css', 'twe-target-highlight');
                        `
        : ''
      }
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
  }, [getIframeContent, viewMode]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = event.data;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (data?.type === 'elementClick') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        onElementClick?.(data.path);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (data?.type === 'elementHover') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        setHoveredElement(data.path);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (data?.type === 'validationResult') {
        onValidationChange?.({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          isValid: data.isValid,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          matchCount: data.matchCount,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementClick]);

  // Highlight user's selector matches
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !userSelector)
      return;

    iframe.contentWindow.postMessage(
      {
        type: 'highlight',
        selector: userSelector,
        selectorType,
        className: 'twe-user-match',
        // Pass target info for validation
        targetSelector,
        targetSelectorType: props.targetSelectorType || 'css',
      },
      '*',
    );

    return () => {
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'clearHighlights' }, '*');
      }
    };
  }, [
    userSelector,
    selectorType,
    viewMode,
    targetSelector,
    props.targetSelectorType,
  ]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <div
      className={cn(
        'flex flex-col bg-background rounded-lg overflow-hidden border border-border/50 shadow-sm',
        isFullscreen && 'fixed inset-4 z-50 border-2 shadow-2xl',
        className,
      )}
    >
      {/* Browser Window Frame */}
      <div className="flex-1 flex flex-col min-h-0 bg-background relative">
        {/* Browser Toolbar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/50 shrink-0">
          {/* Window Controls */}
          <div className="flex gap-1.5 group">
            <div className="w-3 h-3 rounded-full bg-red-500/80 group-hover:bg-red-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 group-hover:bg-yellow-500 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 group-hover:bg-green-500 transition-colors" />
          </div>

          {/* URL Bar & Controls */}
          <div className="flex-1 flex gap-2 max-w-2xl mx-auto w-full">
            <div className="flex-1 flex items-center bg-background border border-border rounded-md px-3 h-8 shadow-sm relative overflow-hidden">
              <Lock className="h-3 w-3 text-muted-foreground mr-2 shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1">
                {targetElementId
                  ? `target-website.com/preview#${targetElementId}`
                  : 'target-website.com/preview'}
              </span>

              {/* Visual/Source Toggle inside URL bar */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5 ml-2 shrink-0">
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'p-1 rounded transition-colors',
                    viewMode === 'preview'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  title="Visual Preview"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode('source')}
                  className={cn(
                    'p-1 rounded transition-colors',
                    viewMode === 'source'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                  title="View Source"
                >
                  <Code2 className="h-3 w-3" />
                </button>
              </div>

              {/* Inspect Mode Badge Inline */}
              {showControls && viewMode === 'preview' && (
                <div className="ml-3 flex items-center pr-2 border-l border-border pl-3">
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] gap-1.5 font-normal bg-primary/10 text-primary border-primary/20 pointer-events-none"
                  >
                    <MousePointerClick className="h-3 w-3" />
                    Inspect Active
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions - Zoom Controls */}
          {viewMode === 'preview' && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs w-8 text-center tabular-nums text-muted-foreground">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden bg-white/50 dark:bg-black/20">
          <div
            className="w-full h-full overflow-auto"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              width: `${100 * (100 / zoom)}%`,
              height: `${100 * (100 / zoom)}%`,
              display: viewMode === 'preview' ? 'block' : 'none',
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={`
                                    <!DOCTYPE html>
                                    <html>
                                        <head>
                                            <style>
                                                ${cssContent}
                                                /* Inject selection styles */
                                                [data-highlight="true"] {
                                                    outline: 2px solid #3b82f6 !important;
                                                    outline-offset: 2px !important;
                                                    background-color: rgba(59, 130, 246, 0.1) !important;
                                                }
                                                [data-hover="true"] {
                                                    outline: 2px dashed #60a5fa !important;
                                                    outline-offset: 1px !important;
                                                    cursor: pointer !important;
                                                }
                                                body {
                                                    margin: 0;
                                                    padding: 16px;
                                                    min-height: 100vh;
                                                    font-family: system-ui, -apple-system, sans-serif;
                                                }
                                            </style>
                                        </head>
                                        <body>${htmlContent}</body>
                                    </html>
                                `}
              className="w-full h-full border-none bg-white"
              title="Challenge Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
          {viewMode === 'source' && (
            <div className="w-full h-full">
              <CodeEditor
                initialCode={htmlContent}
                language="html"
                readOnly={true}
                height="100%"
                className="border-none rounded-none h-full"
                showMinimap={false}
              />
            </div>
          )}
        </div>

        {/* Footer Status */}
        {viewMode === 'preview' && (
          <div className="bg-muted/30 border-t border-border px-3 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-2 truncate">
              {hoveredElement ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-mono">{hoveredElement}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span>Hover over elements to inspect</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>{zoom}%</span>
            </div>
          </div>
        )}
      </div>
      {/* Fullscreen Overlay Backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}

export default WebComponentPreview;
