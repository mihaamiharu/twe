import { Lock, Eye, Code2, Minus, Plus, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ViewMode } from './types';

interface PreviewHeaderProps {
    currentPath?: string;
    files?: Record<string, string>;
    targetElementId?: string;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    zoom: number;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    showControls?: boolean;
}

export function PreviewHeader({
    currentPath,
    files,
    targetElementId,
    viewMode,
    setViewMode,
    zoom,
    handleZoomIn,
    handleZoomOut,
    showControls,
}: PreviewHeaderProps) {
    const previewUrl = files
        ? `testingwithekki.local${currentPath || '/index.html'}`
        : targetElementId
            ? `target-website.com/preview#${targetElementId}`
            : 'target-website.com/preview';

    return (
        <div
            data-testid="preview-header"
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-border bg-muted/50 shrink-0"
        >
            {/* Window Controls & URL Bar */}
            <div className="flex min-w-0 flex-[1_1_220px] items-center gap-2.5">
                <div className="hidden sm:flex gap-1.5 shrink-0 group" aria-hidden="true">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 group-hover:bg-red-500 transition-colors" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 group-hover:bg-yellow-500 transition-colors" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 group-hover:bg-green-500 transition-colors" />
                </div>

                <div className="flex min-w-0 flex-1 items-center bg-background border border-border rounded-md px-2.5 h-8 shadow-sm">
                    <Lock className="h-3 w-3 text-muted-foreground mr-2 shrink-0" aria-hidden="true" />
                    <span
                        className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                        title={previewUrl}
                    >
                        {previewUrl}
                    </span>
                </div>
            </div>

            {/* Preview Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-full">
                {/* Visual/Source Toggle */}
                <div className="flex items-center gap-0.5 bg-background border border-border rounded-md p-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={cn(
                            'p-1 rounded transition-colors',
                            viewMode === 'preview'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                        title="Visual Preview"
                        aria-label="Visual Preview"
                        aria-pressed={viewMode === 'preview'}
                    >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('source')}
                        className={cn(
                            'p-1 rounded transition-colors',
                            viewMode === 'source'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                        title="View Source"
                        aria-label="View Source"
                        aria-pressed={viewMode === 'source'}
                    >
                        <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                </div>

                {/* Inspect Mode Badge */}
                {showControls && viewMode === 'preview' && (
                    <Badge
                        variant="secondary"
                        data-testid="preview-inspect-badge"
                        className="h-6 shrink-0 whitespace-nowrap px-2 text-[11px] gap-1.5 font-normal bg-primary/10 text-primary border-primary/20 pointer-events-none"
                    >
                        <MousePointerClick className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>Inspect Active</span>
                    </Badge>
                )}

                {/* Zoom Controls */}
                {viewMode === 'preview' && (
                    <div
                        data-testid="preview-zoom-controls"
                        className="flex items-center gap-0.5 shrink-0"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={handleZoomOut}
                            title="Zoom Out"
                            aria-label="Zoom Out"
                        >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <span
                            data-testid="preview-zoom-value"
                            className="text-xs min-w-[2.5rem] text-center tabular-nums text-muted-foreground whitespace-nowrap shrink-0"
                        >
                            {zoom}%
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={handleZoomIn}
                            title="Zoom In"
                            aria-label="Zoom In"
                        >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
