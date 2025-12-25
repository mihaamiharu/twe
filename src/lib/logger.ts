/**
 * Structured Logger Utility
 * 
 * A wrapper around console methods that adds:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Environment awareness (silence DEBUG in production)
 * - Consistent formatting
 * - Object/Context printing
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * 
 * logger.debug('Mounting component', { componentId: '123' });
 * logger.error('Failed to fetch', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    level: LogLevel;
    enableInProd: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Default configuration
const config: LoggerOptions = {
    level: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info', // Default to 'info' to reduce noise, or strict 'debug' if needed
    enableInProd: false, // Default to silence in production
};

// Force debug level in development if not explicitly set
if (import.meta.env.DEV && !import.meta.env.VITE_LOG_LEVEL) {
    config.level = 'debug';
}

class Logger {
    private shouldLog(level: LogLevel): boolean {
        // In production, suppress unless enabled
        if (import.meta.env.PROD && !config.enableInProd && level !== 'error') {
            return false;
        }
        return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
    }

    private formatMessage(level: LogLevel, message: string): string[] {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        // Colors for browser console
        const styles = {
            debug: 'color: #9ca3af', // gray-400
            info: 'color: #60a5fa',  // blue-400
            warn: 'color: #f59e0b',  // amber-500
            error: 'color: #ef4444; font-weight: bold', // red-500
        };

        // If running in Node/Server (SSR), colors might need ANSI codes, 
        // but for browser console styles work better.
        // We'll stick to browser styles since this is a client-side app.
        return [`%c${prefix}`, styles[level], message];
    }

    debug(message: string, ...args: any[]) {
        if (this.shouldLog('debug')) {
            console.debug(...this.formatMessage('debug', message), ...args);
        }
    }

    info(message: string, ...args: any[]) {
        if (this.shouldLog('info')) {
            console.info(...this.formatMessage('info', message), ...args);
        }
    }

    warn(message: string, ...args: any[]) {
        if (this.shouldLog('warn')) {
            console.warn(...this.formatMessage('warn', message), ...args);
        }
    }

    error(message: string, ...args: any[]) {
        if (this.shouldLog('error')) {
            console.error(...this.formatMessage('error', message), ...args);
        }
    }

    /**
     * Group logs together (wrapper for console.group)
     */
    group(label: string) {
        if (this.shouldLog('debug')) { // Only group if we are debugging
            console.group(label);
        }
    }

    groupEnd() {
        if (this.shouldLog('debug')) {
            console.groupEnd();
        }
    }
}

export const logger = new Logger();
