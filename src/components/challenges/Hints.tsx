/**
 * Hints - Collapsible hints system for challenges
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lightbulb, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';

export interface Hint {
    id: string;
    content: string;
    xpCost?: number;
}

export interface HintsProps {
    hints: Hint[];
    revealedHints: Set<string>;
    onRevealHint: (hintId: string) => void;
    className?: string;
}

export function Hints({ hints, revealedHints, onRevealHint, className }: HintsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const revealedCount = revealedHints.size;

    if (hints.length === 0) {
        return null;
    }

    return (
        <Card className={cn('glass-card', className)}>
            <CardHeader
                className="py-3 border-b border-border cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        <CardTitle className="text-sm font-medium">Hints</CardTitle>
                        {revealedCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                                ({revealedCount}/{hints.length} revealed)
                            </span>
                        )}
                    </div>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="p-4 space-y-3">
                    {hints.map((hint, index) => {
                        const isRevealed = revealedHints.has(hint.id);

                        return (
                            <div
                                key={hint.id}
                                className={cn(
                                    'p-3 rounded-lg border',
                                    isRevealed
                                        ? 'bg-muted/30 border-border'
                                        : 'bg-muted/10 border-dashed border-border'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Hint {index + 1}
                                    </span>
                                    {!isRevealed && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRevealHint(hint.id)}
                                            className="h-7 text-xs"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Reveal
                                            {hint.xpCost && (
                                                <span className="ml-1 text-yellow-400">(-{hint.xpCost} XP)</span>
                                            )}
                                        </Button>
                                    )}
                                </div>

                                {isRevealed ? (
                                    <p className="text-sm mt-2">{hint.content}</p>
                                ) : (
                                    <p className="text-sm mt-2 text-muted-foreground italic flex items-center gap-1">
                                        <EyeOff className="h-3 w-3" />
                                        Hidden - click to reveal
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            )}
        </Card>
    );
}

export default Hints;
