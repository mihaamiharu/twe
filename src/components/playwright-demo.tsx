import { useState, useEffect } from 'react';
import { CheckCircle2, Play, Terminal } from 'lucide-react';

/**
 * Animated Playwright execution demo.
 * Simulates a code execution environment with console logs and success state.
 */
export function PlaywrightDemo() {
    const [step, setStep] = useState(0);

    const steps = [
        { text: 'Running test...', delay: 0 },
        { text: 'Browser launched', delay: 800 },
        { text: 'Navigating to /login', delay: 1600 },
        { text: 'Filling credentials', delay: 2400 },
        { text: 'Clicking submit', delay: 3200 },
    ];

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;

        const runSimulation = () => {
            setStep(0);

            // Schedule steps
            steps.forEach((_, index) => {
                setTimeout(() => {
                    setStep(index + 1);
                }, steps[index].delay);
            });

            // Reset loop
            timeout = setTimeout(runSimulation, 6000);
        };

        runSimulation();

        return () => clearTimeout(timeout);
    }, []);

    const isComplete = step === steps.length;

    return (
        <div className="mt-4 rounded-lg border border-border/50 bg-slate-950 font-mono text-[10px] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/10 bg-white/5">
                <div className="flex gap-2 items-center">
                    <Terminal className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">test-runner</span>
                </div>
                {isComplete ? (
                    <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        PASSED
                    </span>
                ) : (
                    <span className="text-yellow-400 flex items-center gap-1">
                        <Play className="w-3 h-3 animate-pulse" />
                        RUNNING
                    </span>
                )}
            </div>

            {/* Console Output */}
            <div className="p-3 h-32 flex flex-col gap-1.5 text-slate-300">
                {steps.map((s, i) => (
                    <div
                        key={i}
                        className={`transition-opacity duration-300 flex items-center gap-2 ${i < step ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <span className="text-blue-500">➜</span>
                        <span>{s.text}</span>
                    </div>
                ))}

                {isComplete && (
                    <div className="mt-2 pl-4 text-green-400 animate-fade-in">
                        ✔ 1 test passed (3.2s)
                    </div>
                )}
            </div>
        </div>
    );
}
