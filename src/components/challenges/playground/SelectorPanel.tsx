import { useTranslation } from 'react-i18next';
import { Play, Loader2, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SelectorInput, type SelectorType } from '../SelectorInput';
import type { Challenge, PlaygroundState } from './types';

interface SelectorPanelProps {
    challenge: Challenge;
    state: PlaygroundState;
    onSelectorChange: (value: string, type: SelectorType) => void;
    onValidate: () => void;
}

export function SelectorPanel({
    challenge,
    state,
    onSelectorChange,
    onValidate,
}: SelectorPanelProps) {
    const { t } = useTranslation(['challenges']);
    const {
        selector,
        isRunning,
        testResults,
        hasPassed,
        selectorType
    } = state;

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/90 italic">
                    <div className="h-6 w-6 rounded-full bg-brand-teal flex items-center justify-center text-xs font-bold text-black border-2 border-border hard-shadow-sm">
                        1
                    </div>
                    {t('challenges:playground.step1')}
                </h3>
                <Card className="border border-border rounded-xl shadow-sm overflow-hidden bg-muted/5">
                    <CardContent className="p-4 space-y-4">
                        <SelectorInput
                            value={selector}
                            onChange={onSelectorChange}
                            onValidate={onValidate}
                            defaultType={selectorType}
                            allowTypeChange={true}
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onValidate}
                                disabled={isRunning || !selector}
                                className="font-bold border border-border bg-brand-teal hover:bg-brand-teal/90 text-black dark:text-black transition-all"
                            >
                                {isRunning ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4 mr-2" />
                                )}
                                {t('challenges:playground.testSelector')}
                            </Button>

                            {testResults.length > 0 && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                                        hasPassed
                                            ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                                            : 'bg-red-500/10 text-red-600 border border-red-500/30',
                                    )}
                                >
                                    {hasPassed ? (
                                        <>
                                            <Zap className="h-4 w-4 fill-current" />{' '}
                                            {t('challenges:playground.correct')}
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 shrink-0" />{' '}
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
