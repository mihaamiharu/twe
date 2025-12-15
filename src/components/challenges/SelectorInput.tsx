/**
 * SelectorInput - Input component for CSS/XPath selectors
 * 
 * Features:
 * - Toggle between CSS and XPath mode
 * - Real-time validation feedback
 * - Error/success state visualization
 */

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, Code, Hash } from 'lucide-react';

export type SelectorType = 'css' | 'xpath';

export interface SelectorValidationResult {
    valid: boolean;
    matchCount: number;
    error?: string;
}

export interface SelectorInputProps {
    value: string;
    onChange: (value: string) => void;
    selectorType: SelectorType;
    onTypeChange: (type: SelectorType) => void;
    onSubmit: () => void;
    validationResult?: SelectorValidationResult;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function SelectorInput({
    value,
    onChange,
    selectorType,
    onTypeChange,
    onSubmit,
    validationResult,
    disabled = false,
    placeholder,
    className,
}: SelectorInputProps) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && !disabled) {
                e.preventDefault();
                onSubmit();
            }
        },
        [onSubmit, disabled]
    );

    const defaultPlaceholder =
        selectorType === 'css'
            ? "Enter CSS selector (e.g., .button, #submit)"
            : "Enter XPath (e.g., //button[@id='submit'])";

    return (
        <div className={cn('space-y-3', className)}>
            {/* Type Toggle */}
            <div className="flex items-center gap-2">
                <Button
                    variant={selectorType === 'css' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTypeChange('css')}
                    disabled={disabled}
                >
                    <Hash className="h-4 w-4 mr-1" />
                    CSS
                </Button>
                <Button
                    variant={selectorType === 'xpath' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onTypeChange('xpath')}
                    disabled={disabled}
                >
                    <Code className="h-4 w-4 mr-1" />
                    XPath
                </Button>
            </div>

            {/* Input Field */}
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || defaultPlaceholder}
                    disabled={disabled}
                    className={cn(
                        'font-mono text-sm pr-24',
                        validationResult?.valid === true && 'border-green-500 focus-visible:ring-green-500/50',
                        validationResult?.valid === false && 'border-red-500 focus-visible:ring-red-500/50'
                    )}
                />

                {/* Validation Badge */}
                {validationResult && value && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {validationResult.valid ? (
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                <Check className="h-3 w-3 mr-1" />
                                {validationResult.matchCount} match{validationResult.matchCount !== 1 ? 'es' : ''}
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                                <X className="h-3 w-3 mr-1" />
                                No match
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {validationResult?.error && (
                <p className="text-sm text-red-400">{validationResult.error}</p>
            )}
        </div>
    );
}

export default SelectorInput;
