/**
 * TestResults - Display test case results
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Loader2 } from 'lucide-react';

export interface TestResult {
    id: string;
    name: string;
    passed: boolean;
    error?: string;
    executionTime?: number;
}

export interface TestResultsProps {
    results: TestResult[];
    isRunning?: boolean;
    className?: string;
}

export function TestResults({ results, isRunning = false, className }: TestResultsProps) {
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount && totalCount > 0;

    return (
        <Card className={cn('glass-card', className)}>
            <CardHeader className="py-3 border-b border-border">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Test Results</CardTitle>
                    {isRunning ? (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Running...
                        </Badge>
                    ) : results.length > 0 ? (
                        <Badge
                            variant="outline"
                            className={cn(
                                allPassed
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                            )}
                        >
                            {passedCount}/{totalCount} Passed
                        </Badge>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {results.length === 0 && !isRunning ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Run your code to see test results
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {results.map((result) => (
                            <li
                                key={result.id}
                                className={cn(
                                    'px-4 py-3 flex items-start gap-3',
                                    result.passed ? 'bg-green-500/5' : 'bg-red-500/5'
                                )}
                            >
                                <div className="mt-0.5">
                                    {result.passed ? (
                                        <Check className="h-4 w-4 text-green-400" />
                                    ) : (
                                        <X className="h-4 w-4 text-red-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{result.name}</p>
                                    {result.error && (
                                        <p className="text-xs text-red-400 mt-1 font-mono">{result.error}</p>
                                    )}
                                    {result.executionTime !== undefined && (
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {result.executionTime}ms
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export default TestResults;
