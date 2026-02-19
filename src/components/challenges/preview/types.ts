import type { RefObject } from 'react';

export type SelectorType = 'css' | 'xpath';

export interface WebComponentPreviewProps {
    htmlContent: string;
    cssContent?: string;
    targetElementId?: string;
    targetSelector?: string;
    userSelector?: string;
    selectorType?: SelectorType;
    targetSelectorType?: SelectorType;
    onElementClick?: (elementPath: string) => void;
    onValidationChange?: (result: {
        isValid: boolean;
        matchCount: number;
    }) => void;
    showControls?: boolean;
    height?: string | number;
    className?: string;
    iframeRef?: RefObject<HTMLIFrameElement | null>;
    files?: Record<string, string>;
    currentPath?: string;
    onNavigate?: (path: string) => void;
    /** When true, prevents the preview from overwriting iframe content (used during code execution) */
    isExecuting?: boolean;
}

export type ViewMode = 'preview' | 'source';

export interface PreviewState {
    zoom: number;
    setZoom: (val: number | ((prev: number) => number)) => void;
    hoveredElement: string | null;
    setHoveredElement: (val: string | null) => void;
    viewMode: ViewMode;
    setViewMode: (val: ViewMode) => void;
    isFullscreen: boolean;
    setIsFullscreen: (val: boolean) => void;
}
