interface PreviewFooterProps {
    hoveredElement: string | null;
    zoom: number;
}

export function PreviewFooter({ hoveredElement, zoom }: PreviewFooterProps) {
    return (
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
    );
}
