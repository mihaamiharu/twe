export interface InterceptedLog {
    id: string;
    type: string;
    message: string;
}

/**
 * Creates an intercepted console object that redirects logs to a custom collector
 */
export function createInterceptedConsole(
    logs: InterceptedLog[],
    logCounter: { current: number }
) {
    const addLog = (type: string, ...args: unknown[]) => {
        logs.push({
            id: `log-${Date.now()}-${logCounter.current++}`,
            type,
            message: args.map((a) => String(a)).join(' '),
        });
    };

    return {
        log: (...args: unknown[]) => addLog('log', ...args),
        error: (...args: unknown[]) => addLog('error', ...args),
        warn: (...args: unknown[]) => addLog('warn', ...args),
        info: (...args: unknown[]) => addLog('log', ...args),
    };
}
