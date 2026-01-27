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
    return (
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
                        {files
                            ? `testingwithekki.local${currentPath || '/index.html'}`
                            : targetElementId
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
    );
}
