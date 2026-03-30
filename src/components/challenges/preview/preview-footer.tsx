interface PreviewFooterProps {
    hoveredElement: string | null;
    zoom: number;
}

export function PreviewFooter({ hoveredElement, zoom }: PreviewFooterProps) {
    return (
        <div className="bg-muted/50 border-t border-border px-3 py-2 flex items-center justify-between text-sm text-foreground shrink-0 min-h-10 transition-all duration-300">
            <div className="flex items-center gap-2.5 flex-1 mr-4 min-w-0">
                {hoveredElement ? (
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shrink-0" />
                        <span className="font-mono font-medium text-[11px] leading-tight break-all" title={hoveredElement}>
                            {hoveredElement}
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
                        <span className="text-muted-foreground italic">Hover over elements to inspect</span>
                    </>
                )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium shrink-0">
                <span>{zoom}%</span>
            </div>
        </div>
    );
}
