import { useState, useEffect } from 'react';

/**
 * Animated sandbox demo component showing typing effect and element highlighting.
 * Used in the Features section to demonstrate the browser simulation capability.
 */
export function SelectorDemo() {
    const [typedText, setTypedText] = useState('');
    const [isHighlighting, setIsHighlighting] = useState(false);
    const fullCode = 'page.locator("#submit-btn")';

    useEffect(() => {
        let currentIndex = 0;
        let typingInterval: ReturnType<typeof setInterval>;
        let resetTimeout: ReturnType<typeof setTimeout>;

        const startTyping = () => {
            setTypedText('');
            setIsHighlighting(false);
            currentIndex = 0;

            typingInterval = setInterval(() => {
                if (currentIndex < fullCode.length) {
                    setTypedText(fullCode.slice(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(typingInterval);
                    setIsHighlighting(true);
                    // Reset after showing the highlight
                    resetTimeout = setTimeout(startTyping, 2500);
                }
            }, 80);
        };

        startTyping();

        return () => {
            clearInterval(typingInterval);
            clearTimeout(resetTimeout);
        };
    }, []);

    return (
        <div className="mt-4 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
            {/* Mini browser preview */}
            <div className="p-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono">search-box.html</div>
                </div>
                {/* Mini form preview */}
                <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-24 bg-muted rounded text-[8px] flex items-center px-1.5 text-muted-foreground/60">
                        username
                    </div>
                    <button
                        id="submit-btn"
                        className={`
              h-5 w-16 rounded text-[8px] font-medium
              transition-all duration-300
              ${isHighlighting
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg shadow-primary/30 scale-105'
                                : 'bg-primary/20 text-primary/60'
                            }
            `}
                    >
                        Submit
                    </button>
                </div>
            </div>
            {/* Code editor preview */}
            <div className="p-2 font-mono text-[10px]">
                <span className="text-muted-foreground/60">{'> '}</span>
                <span className="text-primary">{typedText}</span>
                <span className="animate-pulse text-primary">|</span>
            </div>
        </div>
    );
}
