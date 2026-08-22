import { useTranslation } from 'react-i18next';
import { Loader2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TestResults } from '../test-results';
import { ConsoleOutput } from '../console-output';
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
    isRunning,
  } = state;

  return (
    <div className="workspace-panel flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-workspace-border bg-workspace-panel shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setResultsTab('results')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-sm transition-colors',
              resultsTab === 'results'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-workspace-muted hover:text-workspace-text hover:bg-workspace-elevated',
            )}
          >
            {t('challenges:playground.results')}
          </button>
          <button
            onClick={() => setResultsTab('console')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-sm transition-colors',
              resultsTab === 'console'
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'text-workspace-muted hover:text-workspace-text hover:bg-workspace-elevated',
            )}
          >
            {t('challenges:playground.console')}
            {consoleLogs.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-workspace-elevated rounded-sm">
                {consoleLogs.length}
              </span>
            )}
          </button>
        </div>

        <Button
          size="sm"
          onClick={onRunCode}
          disabled={isRunning}
          className="h-8 rounded-md text-xs font-medium bg-brand-orange text-workspace-background hover:bg-brand-orange/90"
        >
          {isRunning ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Play className="h-3 w-3 mr-1" />
          )}
          {t('common:actions.run')}
        </Button>
      </div>
      <div
        className={cn(
          'flex-1 overflow-auto',
          resultsTab === 'console' && 'technical-surface',
        )}
      >
        {resultsTab === 'results' ? (
          <div className="p-3 pt-2">
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
