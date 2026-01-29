interface PreviewFooterProps {
    hoveredElement: string | null;
    zoom: number;
}

export function PreviewFooter({ hoveredElement, zoom }: PreviewFooterProps) {
    return (
        <div className="bg-muted/50 border-t border-border px-3 py-2 flex items-center justify-between text-sm text-foreground shrink-0 h-10">
            <div className="flex items-center gap-2.5 truncate flex-1 mr-4">
                {hoveredElement ? (
                    <>
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shrink-0" />
                        <span className="font-mono font-medium truncate" title={hoveredElement}>
                            {hoveredElement}
                        </span>
                    </>
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
