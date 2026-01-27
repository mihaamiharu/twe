import { useTranslation } from 'react-i18next';
import { Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TestResults } from '../TestResults';
import { ConsoleOutput } from '../ConsoleOutput';
import type { Challenge, PlaygroundState } from './types';

interface ResultsPanelProps {
    challenge: Challenge;
    state: PlaygroundState;
    onRunCode: () => void;
}

export function ResultsPanel({
    challenge,
    state,
    onRunCode,
}: ResultsPanelProps) {
    const { t } = useTranslation(['challenges', 'common']);
    const {
        resultsTab,
        setResultsTab,
        consoleLogs,
        setConsoleLogs,
        testResults,
        isRunning
    } = state;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/10 shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setResultsTab('results')}
                        className={cn(
                            'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                            resultsTab === 'results'
                                ? 'bg-brand-teal/20 text-brand-teal-dark'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        )}
                    >
                        {t('challenges:playground.results')}
                    </button>
                    <button
                        onClick={() => setResultsTab('console')}
                        className={cn(
                            'px-3 py-1 text-xs font-bold rounded-md transition-colors',
                            resultsTab === 'console'
                                ? 'bg-brand-teal/20 text-brand-teal-dark'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                        )}
                    >
                        {t('challenges:playground.console')}
                        {consoleLogs.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-muted rounded-full">
                                {consoleLogs.length}
                            </span>
                        )}
                    </button>
                </div>

                <Button
                    size="sm"
                    onClick={onRunCode}
                    disabled={isRunning}
                    className="h-7 text-xs font-bold bg-brand-teal text-black hover:bg-brand-teal/90"
                >
                    {isRunning ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                        <Play className="h-3 w-3 mr-1" />
                    )}
                    {t('common:actions.run')}
                </Button>
            </div>
            <div className="flex-1 overflow-auto">
                {resultsTab === 'results' ? (
                    <div className="p-4 pt-2">
                        <TestResults
                            results={testResults}
                            isRunning={isRunning}
                            challengeType={challenge.type}
                            className="border-0 shadow-none bg-transparent"
                        />
                    </div>
                ) : (
                    <ConsoleOutput
                        logs={consoleLogs}
                        onClear={() => setConsoleLogs([])}
                        className="h-full"
                    />
                )}
            </div>
        </div>
    );
}
