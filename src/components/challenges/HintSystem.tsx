/**
 * HintSystem - Component for displaying progressive hints
 * 
 * Features:
 * - Progressive hint reveal
 * - XP cost warning
 * - Hint countdown/cooldown
 * - Collapsible hint display
 */

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Lock,
    AlertTriangle,
    Star,
} from 'lucide-react';

export interface Hint {
    id: string;
    content: string;
    xpCost?: number;
    order: number;
}

export interface HintSystemProps {
    hints: Hint[];
    revealedHintIds?: Set<string>;
    onRevealHint?: (hintId: string) => void;
    totalXpCost?: number;
    disabled?: boolean;
    className?: string;
}

export function HintSystem({
    hints,
    revealedHintIds = new Set(),
    onRevealHint,
    totalXpCost = 0,
    disabled = false,
    className,
}: HintSystemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [confirmingHintId, setConfirmingHintId] = useState<string | null>(null);

    const sortedHints = [...hints].sort((a, b) => a.order - b.order);
    const revealedCount = revealedHintIds.size;
    const totalHints = hints.length;

    // Handle hint reveal
    const handleRevealHint = useCallback((hint: Hint) => {
        if (hint.xpCost && hint.xpCost > 0) {
            // Show confirmation for hints with XP cost
            setConfirmingHintId(hint.id);
        } else {
            // Reveal immediately for free hints
            onRevealHint?.(hint.id);
        }
    }, [onRevealHint]);

    // Confirm hint reveal
    const confirmReveal = useCallback(() => {
        if (confirmingHintId) {
            onRevealHint?.(confirmingHintId);
            setConfirmingHintId(null);
        }
    }, [confirmingHintId, onRevealHint]);

    // Cancel confirmation
    const cancelConfirm = useCallback(() => {
        setConfirmingHintId(null);
    }, []);

    if (hints.length === 0) {
        return null;
    }

    return (
        <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Hints</span>
                    <Badge variant="secondary" className="text-xs">
                        {revealedCount}/{totalHints}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    {totalXpCost > 0 && revealedCount > 0 && (
                        <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/20">
                            <Star className="h-3 w-3 mr-1" />
                            -{totalXpCost} XP used
                        </Badge>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* Hints List */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {sortedHints.map((hint, index) => {
                        const isRevealed = revealedHintIds.has(hint.id);
                        const isNextToReveal = !isRevealed &&
                            sortedHints.slice(0, index).every(h => revealedHintIds.has(h.id));
                        const isLocked = !isRevealed && !isNextToReveal;
                        const isConfirming = confirmingHintId === hint.id;

                        return (
                            <div key={hint.id} className="relative">
                                {/* Hint Card */}
                                <div className={cn(
                                    'rounded-lg border p-3 transition-all',
                                    isRevealed && 'border-amber-500/30 bg-amber-500/5',
                                    isNextToReveal && !isConfirming && 'border-border hover:border-amber-500/30',
                                    isLocked && 'border-border bg-muted/30',
                                    isConfirming && 'border-amber-500/50 bg-amber-500/10'
                                )}>
                                    {/* Hint Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                Hint {index + 1}
                                            </span>
                                            {hint.xpCost && hint.xpCost > 0 && !isRevealed && (
                                                <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/20">
                                                    <Star className="h-3 w-3 mr-0.5" />
                                                    {hint.xpCost} XP
                                                </Badge>
                                            )}
                                        </div>

                                        {isLocked && (
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Hint Content */}
                                    {isRevealed ? (
                                        <p className="text-sm text-foreground">
                                            {hint.content}
                                        </p>
                                    ) : isNextToReveal ? (
                                        <div>
                                            {isConfirming ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-2 text-sm text-amber-500">
                                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                                        <span>
                                                            Revealing this hint will cost {hint.xpCost || 0} XP.
                                                            Continue?
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={confirmReveal}
                                                            className="h-7"
                                                        >
                                                            Reveal Hint
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={cancelConfirm}
                                                            className="h-7"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRevealHint(hint)}
                                                    disabled={disabled}
                                                    className="h-7 text-xs"
                                                >
                                                    <Lightbulb className="h-3 w-3 mr-1" />
                                                    Reveal Hint
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            Reveal previous hints first
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* All Hints Revealed Message */}
                    {revealedCount === totalHints && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                            All hints revealed!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default HintSystem;
