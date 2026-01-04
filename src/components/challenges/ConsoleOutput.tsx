/**
 * ConsoleOutput - Component to display console logs from user code execution
 * 
 * Features:
 * - Color-coded log types (log, warn, error)
 * - Clear button
 * - Auto-scroll to bottom
 * - Empty state
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2, Terminal } from 'lucide-react';

export interface LogEntry {
    id?: string;
    type: 'log' | 'warn' | 'error';
    message: string;
    timestamp?: number;
}

export interface ConsoleOutputProps {
    logs: LogEntry[];
    onClear?: () => void;
    className?: string;
}

const LOG_STYLES: Record<LogEntry['type'], string> = {
    log: 'text-foreground',
    warn: 'text-yellow-500',
    error: 'text-red-500',
};

const LOG_PREFIXES: Record<LogEntry['type'], string> = {
    log: '›',
    warn: '⚠',
    error: '✕',
};

export function ConsoleOutput({ logs, onClear, className }: ConsoleOutputProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    if (logs.length === 0) {
        return (
            <div className={cn('flex flex-col items-center justify-center h-full min-h-[120px] text-center p-4', className)}>
                <div className="bg-muted/50 p-3 rounded-full mb-3">
                    <Terminal className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                    Console output will appear here
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Use <code className="bg-muted px-1 py-0.5 rounded text-xs">console.log()</code> to debug your code
                </p>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                    {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </span>
                {onClear && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Logs */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-3 font-mono text-sm space-y-1"
            >
                {logs.map((log, index) => (
                    <div
                        key={log.id || `log-${index}`}
                        className={cn(
                            'flex items-start gap-2 py-0.5',
                            LOG_STYLES[log.type]
                        )}
                    >
                        <span className="shrink-0 opacity-60 select-none">
                            {LOG_PREFIXES[log.type]}
                        </span>
                        <span className="break-all whitespace-pre-wrap">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ConsoleOutput;
