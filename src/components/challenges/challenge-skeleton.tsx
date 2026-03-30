export function ChallengeSkeleton() {
    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden animate-pulse bg-background">
            {/* Skeleton for Panel Group layout - mimic 40/60 split */}
            <div className="flex-1 flex w-full">
                {/* Left Panel: Instructions (approx 40%) */}
                <div className="w-[40%] bg-muted/5 border-r border-border/40 p-6 space-y-4 flex flex-col">
                    <div className="flex gap-2 mb-4 border-b border-border/40 pb-2">
                        <div className="h-8 w-24 bg-muted/20 rounded-md" />
                        <div className="h-8 w-24 bg-muted/10 rounded-md" />
                    </div>
                    <div className="h-8 w-3/4 bg-muted/20 rounded-md" />
                    <div className="space-y-3 pt-4">
                        <div className="h-4 w-full bg-muted/20 rounded-md" />
                        <div className="h-4 w-[90%] bg-muted/20 rounded-md" />
                        <div className="h-4 w-[95%] bg-muted/20 rounded-md" />
                        <div className="h-4 w-[80%] bg-muted/20 rounded-md" />
                    </div>
                    <div className="flex-1" />
                </div>

                {/* Handle */}
                <div className="w-[1px] bg-border/40" />

                {/* Right Panel: Editor (approx 60%) */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Editor Header */}
                    <div className="h-10 border-b border-border/40 bg-muted/5 flex items-center justify-between px-4">
                        <div className="h-4 w-20 bg-muted/20 rounded-md" />
                        <div className="h-6 w-6 bg-muted/20 rounded-md" />
                    </div>
                    {/* Editor Content */}
                    <div className="flex-1 p-4 space-y-2">
                        <div className="h-4 w-1/3 bg-muted/20 rounded-md" />
                        <div className="h-4 w-1/2 bg-muted/20 rounded-md ml-4" />
                        <div className="h-4 w-1/4 bg-muted/20 rounded-md ml-8" />
                        <div className="h-4 w-1/3 bg-muted/20 rounded-md ml-4" />
                        <div className="h-4 w-1/5 bg-muted/20 rounded-md" />
                    </div>

                    {/* Results Area */}
                    <div className="h-[30%] border-t border-border/40 p-4 space-y-2">
                        <div className="h-5 w-24 bg-muted/20 rounded-md mb-2" />
                        <div className="h-full w-full bg-muted/10 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}
