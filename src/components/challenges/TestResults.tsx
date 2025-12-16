/**
 * TestResults - Component to display test case execution results
 * 
 * Features:
 * - Show pass/fail status for each test
 * - Expandable error details
 * - Summary stats (passed/total)
 * - Animation for results
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    AlertTriangle,
    Loader2,
} from 'lucide-react';

export interface TestResult {
    id: string;
    name: string;
    description?: string;
    passed: boolean;
    output?: unknown;
    expected?: unknown;
    error?: string;
    executionTime?: number;
    isHidden?: boolean;
}

export interface TestResultsProps {
    results: TestResult[];
    isRunning?: boolean;
    totalHiddenTests?: number;
    hiddenTestsPassed?: number;
    className?: string;
}

export function TestResults({
    results,
    isRunning = false,
    totalHiddenTests = 0,
    hiddenTestsPassed = 0,
    className,
}: TestResultsProps) {
    const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

    // Calculate stats
    const visiblePassed = results.filter((r) => r.passed).length;
    const totalPassed = visiblePassed + hiddenTestsPassed;
    const totalTests = results.length + totalHiddenTests;
    const allPassed = totalPassed === totalTests && totalTests > 0;

    // Toggle test expansion
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedTests);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedTests(newExpanded);
    };

    // Expand/collapse all
    const expandAll = () => {
        const failedIds = results.filter((r) => !r.passed && r.error).map((r) => r.id);
        setExpandedTests(new Set(failedIds));
    };

    const collapseAll = () => {
        setExpandedTests(new Set());
    };

    if (isRunning) {
        return (
            <div className={cn('p-4 rounded-lg border border-border bg-card', className)}>
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Running tests...</span>
                </div>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className={cn('p-4 rounded-lg border border-border bg-card text-muted-foreground', className)}>
                No test results yet. Run your code to see results.
            </div>
        );
    }

    return (
        <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
            {/* Header with Summary */}
            <div className={cn(
                'px-4 py-3 border-b border-border flex items-center justify-between',
                allPassed ? 'bg-green-500/10' : 'bg-destructive/10'
            )}>
                <div className="flex items-center gap-3">
                    {allPassed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                        <span className={cn('font-medium', allPassed ? 'text-green-500' : 'text-destructive')}>
                            {allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
                        </span>
                        <span className="text-muted-foreground ml-2">
                            ({totalPassed}/{totalTests})
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 text-xs">
                        Expand Failed
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 text-xs">
                        Collapse All
                    </Button>
                </div>
            </div>

            {/* Test Results List */}
            <div className="divide-y divide-border">
                {results.map((result, index) => (
                    <div key={result.id} className="group">
                        {/* Test Header Row */}
                        <button
                            onClick={() => result.error && toggleExpand(result.id)}
                            className={cn(
                                'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                                result.error && 'hover:bg-muted/50 cursor-pointer',
                                !result.error && 'cursor-default'
                            )}
                        >
                            {/* Pass/Fail Icon */}
                            {result.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}

                            {/* Test Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">
                                        Test {index + 1}: {result.name || result.description || 'Test Case'}
                                    </span>
                                    {result.isHidden && (
                                        <Badge variant="secondary" className="text-xs">
                                            Hidden
                                        </Badge>
                                    )}
                                </div>
                                {result.description && result.name !== result.description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {result.description}
                                    </p>
                                )}
                            </div>

                            {/* Execution Time */}
                            {result.executionTime !== undefined && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                    <Clock className="h-3 w-3" />
                                    {result.executionTime}ms
                                </div>
                            )}

                            {/* Expand Icon */}
                            {result.error && (
                                <div className="shrink-0">
                                    {expandedTests.has(result.id) ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                        </button>

                        {/* Expanded Error Details */}
                        {expandedTests.has(result.id) && result.error && (
                            <div className="px-4 pb-4 pt-0 ml-7 space-y-3">
                                {/* Error Message */}
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                        <pre className="text-sm text-destructive font-mono whitespace-pre-wrap break-words">
                                            {result.error}
                                        </pre>
                                    </div>
                                </div>

                                {/* Expected vs Actual */}
                                {(result.expected !== undefined || result.output !== undefined) && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {result.expected !== undefined && (
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Expected:</div>
                                                <pre className="text-sm font-mono text-green-500 whitespace-pre-wrap break-words">
                                                    {JSON.stringify(result.expected, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {result.output !== undefined && (
                                            <div className="p-3 rounded-lg bg-muted/50">
                                                <div className="text-xs text-muted-foreground mb-1">Received:</div>
                                                <pre className="text-sm font-mono text-destructive whitespace-pre-wrap break-words">
                                                    {JSON.stringify(result.output, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Hidden Tests Summary */}
                {totalHiddenTests > 0 && (
                    <div className="px-4 py-3 flex items-center gap-3 bg-muted/30">
                        <div className={cn(
                            'h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                            hiddenTestsPassed === totalHiddenTests
                                ? 'bg-green-500 text-white'
                                : 'bg-muted-foreground text-background'
                        )}>
                            ?
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {hiddenTestsPassed}/{totalHiddenTests} hidden tests passed
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TestResults;
