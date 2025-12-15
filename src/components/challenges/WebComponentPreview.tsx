/**
 * WebComponentPreview - Iframe preview for challenge HTML
 * 
 * Features:
 * - Renders challenge HTML in isolated iframe
 * - Highlights target elements on hover/selection
 * - Shows element info on hover
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SelectorType } from './SelectorInput';

export interface WebComponentPreviewProps {
    htmlContent: string;
    selector?: string;
    selectorType?: SelectorType;
    highlightColor?: string;
    onElementClick?: (element: HTMLElement, selector: string) => void;
    className?: string;
}

export function WebComponentPreview({
    htmlContent,
    selector,
    selectorType = 'css',
    highlightColor = '#22d3ee',
    onElementClick,
    className,
}: WebComponentPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [matchCount, setMatchCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Inject HTML and set up event listeners
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument;
        if (!doc) return;

        // Inject HTML with base styles
        doc.open();
        doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: system-ui, sans-serif; 
              padding: 16px; 
              margin: 0;
              background: white;
              color: #1a1a2e;
            }
            .twe-highlight {
              outline: 3px solid ${highlightColor} !important;
              outline-offset: 2px;
              background-color: ${highlightColor}20 !important;
            }
            .twe-hover-highlight {
              outline: 2px dashed #94a3b8 !important;
              outline-offset: 1px;
            }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
        doc.close();

        // Set up hover highlighting
        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BODY' && target.tagName !== 'HTML') {
                target.classList.add('twe-hover-highlight');
            }
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            target.classList.remove('twe-hover-highlight');
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName !== 'BODY' && target.tagName !== 'HTML' && onElementClick) {
                e.preventDefault();
                // Generate a simple CSS selector for the clicked element
                let generatedSelector = target.tagName.toLowerCase();
                if (target.id) {
                    generatedSelector = `#${target.id}`;
                } else if (target.className) {
                    generatedSelector = `.${target.className.split(' ').join('.')}`;
                }
                onElementClick(target, generatedSelector);
            }
        };

        doc.body.addEventListener('mouseover', handleMouseOver);
        doc.body.addEventListener('mouseout', handleMouseOut);
        doc.body.addEventListener('click', handleClick);

        return () => {
            doc.body.removeEventListener('mouseover', handleMouseOver);
            doc.body.removeEventListener('mouseout', handleMouseOut);
            doc.body.removeEventListener('click', handleClick);
        };
    }, [htmlContent, highlightColor, onElementClick]);

    // Highlight matching elements
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentDocument;
        if (!doc) return;

        // Remove previous highlights
        doc.querySelectorAll('.twe-highlight').forEach((el) => {
            el.classList.remove('twe-highlight');
        });

        if (!selector) {
            setMatchCount(0);
            setError(null);
            return;
        }

        try {
            let elements: NodeListOf<Element> | Element[];

            if (selectorType === 'css') {
                elements = doc.querySelectorAll(selector);
            } else {
                // XPath
                const result = doc.evaluate(
                    selector,
                    doc.body,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );
                elements = [];
                for (let i = 0; i < result.snapshotLength; i++) {
                    const node = result.snapshotItem(i);
                    if (node instanceof Element) {
                        (elements as Element[]).push(node);
                    }
                }
            }

            // Highlight matching elements
            const elementArray = Array.from(elements);
            elementArray.forEach((el) => {
                el.classList.add('twe-highlight');
            });

            setMatchCount(elementArray.length);
            setError(null);
        } catch (err) {
            setMatchCount(0);
            setError(err instanceof Error ? err.message : 'Invalid selector');
        }
    }, [selector, selectorType]);

    return (
        <div className={cn('rounded-lg overflow-hidden border border-border bg-white', className)}>
            <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Preview</span>
                {selector && (
                    <span className="text-xs text-muted-foreground">
                        {error ? (
                            <span className="text-red-400">{error}</span>
                        ) : (
                            `${matchCount} element${matchCount !== 1 ? 's' : ''} selected`
                        )}
                    </span>
                )}
            </div>
            <iframe
                ref={iframeRef}
                className="w-full h-full bg-white"
                style={{ minHeight: '200px' }}
                title="Challenge Preview"
                sandbox="allow-scripts allow-same-origin"
            />
        </div>
    );
}

export default WebComponentPreview;
