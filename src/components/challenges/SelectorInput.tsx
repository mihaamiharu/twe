/**
 * SelectorInput - Input component for CSS/XPath selector challenges
 * 
 * Features:
 * - Text input for selectors
 * - CSS/XPath type toggle
 * - Syntax validation feedback
 * - Copy selector button
 */

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Check, Copy, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateSelector, type SelectorType, type ValidationResult } from '@/lib/selector-validator';

// Re-export types for consumers
export type { SelectorType };
// SelectorValidationResult supports both ValidationResult format and ChallengePlayground format
export interface SelectorValidationResult {
    isValid?: boolean;  // From ValidationResult
    valid?: boolean;    // For ChallengePlayground
    error?: string;
    matchCount?: number;
}

export interface SelectorInputProps {
    value?: string;
    onChange?: (value: string, type: SelectorType) => void;
    onValidate?: (value: string, type: SelectorType) => void;
    defaultType?: SelectorType;
    allowTypeChange?: boolean;
    placeholder?: string;
    disabled?: boolean;
    showValidation?: boolean;
    validationResult?: {
        isCorrect: boolean;
        feedback: string;
    };
    className?: string;
}

export function SelectorInput({
    value: controlledValue,
    onChange,
    onValidate,
    defaultType = 'css',
    allowTypeChange = true,
    placeholder,
    disabled = false,
    showValidation = true,
    validationResult,
    className,
}: SelectorInputProps) {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const [selectorType, setSelectorType] = useState<SelectorType>(defaultType);
    const [syntaxValidation, setSyntaxValidation] = useState<ValidationResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Use controlled or internal value
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Update internal value when controlled value changes
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    // Validate syntax on value change (debounced)
    useEffect(() => {
        if (!showValidation || !value.trim()) {
            setSyntaxValidation(null);
            return;
        }

        const timer = setTimeout(() => {
            const result = validateSelector(value, selectorType);
            setSyntaxValidation(result);
        }, 300);

        return () => clearTimeout(timer);
    }, [value, selectorType, showValidation]);

    // Handle value change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange?.(newValue, selectorType);
    }, [onChange, selectorType]);

    // Handle type toggle
    const handleTypeToggle = useCallback((type: SelectorType) => {
        setSelectorType(type);
        onChange?.(value, type);
    }, [value, onChange]);

    // Handle validate button click
    const handleValidate = useCallback(() => {
        if (value.trim()) {
            onValidate?.(value, selectorType);
        }
    }, [value, selectorType, onValidate]);

    // Handle copy to clipboard
    const handleCopy = useCallback(async () => {
        if (value) {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [value]);

    // Handle Enter key press
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && value.trim() && onValidate) {
            e.preventDefault();
            handleValidate();
        }
    }, [value, onValidate, handleValidate]);

    // Determine placeholder based on type
    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        return selectorType === 'css'
            ? 'Enter CSS selector (e.g., #submit-btn, .btn-primary)'
            : 'Enter XPath (e.g., //button[@type="submit"])';
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Type Toggle */}
            {allowTypeChange && (
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Selector Type</span>
                    <div className="flex bg-muted p-1 rounded-md">
                        <button
                            type="button"
                            onClick={() => handleTypeToggle('css')}
                            disabled={disabled}
                            className={cn(
                                "text-xs font-medium px-3 py-1 rounded transition-all",
                                selectorType === 'css'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            CSS
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeToggle('xpath')}
                            disabled={disabled}
                            className={cn(
                                "text-xs font-medium px-3 py-1 rounded transition-all",
                                selectorType === 'xpath'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            XPath
                        </button>
                    </div>
                </div>
            )}

            {/* Input with Actions */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        type="text"
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        disabled={disabled}
                        className={cn(
                            'font-mono pr-10',
                            syntaxValidation && !syntaxValidation.isValid && 'border-destructive',
                            validationResult?.isCorrect && 'border-green-500'
                        )}
                    />
                    {/* Copy button inside input */}
                    <button
                        type="button"
                        onClick={() => void handleCopy()}
                        disabled={!value || disabled}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors mr-1"
                        title="Copy selector"
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                </div>


            </div>

            {/* Syntax Validation Feedback */}
            {showValidation && syntaxValidation && !syntaxValidation.isValid && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{syntaxValidation.error}</span>
                </div>
            )}

            {/* Validation Result Feedback */}
            {validationResult && (
                <div className={cn(
                    'flex items-center gap-2 text-sm p-3 rounded-lg',
                    validationResult.isCorrect
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                )}>
                    {validationResult.isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{validationResult.feedback}</span>
                </div>
            )}
        </div>
    );
}

export default SelectorInput;
