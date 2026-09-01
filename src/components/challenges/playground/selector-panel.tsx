import { useTranslation } from 'react-i18next';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SelectorInput, type SelectorType } from '../selector-input';
import type { Challenge, PlaygroundState } from './types';

interface SelectorPanelProps {
  challenge: Challenge;
  state: PlaygroundState;
  onSelectorChange: (value: string, type: SelectorType) => void;
  onValidate: () => void;
}

export function SelectorPanel({
  state,
  onSelectorChange,
  onValidate,
}: SelectorPanelProps) {
  const { t } = useTranslation(['challenges']);
  const { selector, isRunning, testResults, hasPassed, selectorType } = state;

  return (
    <div className="workspace-panel space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-bold flex items-center gap-2 text-workspace-text">
          <div className="h-6 w-6 rounded-md bg-brand-orange/15 flex items-center justify-center text-xs font-bold text-brand-orange border border-brand-orange/30">
            1
          </div>
          {t('challenges:playground.step1')}
        </h3>
        <Card className="border border-workspace-border rounded-md shadow-none overflow-hidden bg-workspace-panel">
          <CardContent className="p-4 space-y-4">
            <SelectorInput
              value={selector}
              onChange={onSelectorChange}
              onValidate={onValidate}
              defaultType={selectorType}
              allowTypeChange={true}
            />
            <div className="flex items-center justify-between pt-2 border-t border-workspace-border">
              <Button
                variant="default"
                size="sm"
                onClick={onValidate}
                disabled={isRunning || !selector}
                className="font-bold border border-brand-orange bg-brand-orange hover:bg-brand-orange/90 text-workspace-background transition-colors duration-150"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {t('challenges:playground.testSelector')}
              </Button>

              {testResults.length > 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-[background-color,border-color,color] duration-150',
                    hasPassed
                      ? 'bg-brand-success/10 text-brand-success border border-brand-success/30'
                      : 'bg-brand-error/10 text-brand-error border border-brand-error/30',
                  )}
                >
                  {hasPassed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> ✓ PASSED
                      <span className="sr-only">
                        {t('challenges:playground.correct')}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 shrink-0" />{' '}
                      {testResults[0]?.error ||
                        t('challenges:playground.selectorMismatch')}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
