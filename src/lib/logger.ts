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

// Safe environment detection
const isServer = typeof window === 'undefined';
const env = import.meta.env || {};

// Default configuration
const config: LoggerOptions = {
  level: (env.VITE_LOG_LEVEL as LogLevel) || 'info',
  enableInProd: false,
};

// Force debug level in development if not explicitly set
if (env.DEV && !env.VITE_LOG_LEVEL) {
  config.level = 'debug';
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, suppress unless enabled
    // Safe check for PROD in case it's undefined
    const isProd = env.PROD === true;
    if (isProd && !config.enableInProd && level !== 'error') {
      return false;
    }
    // eslint-disable-next-line security/detect-object-injection
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
  }

  private formatMessage(level: LogLevel, message: string): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (isServer) {
      // Server-side (No CSS colors support in standard console, use basic text)
      return [`${prefix} ${message}`];
    }

    // Client-side (Browser formatting)
    const styles: Record<string, string> = {
      debug: 'color: #9ca3af', // gray-400
      info: 'color: #60a5fa', // blue-400
      warn: 'color: #f59e0b', // amber-500
      error: 'color: #ef4444; font-weight: bold', // red-500
    };

    // eslint-disable-next-line security/detect-object-injection
    return [`%c${prefix}`, styles[level], message];
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message), ...args);
    }
  }

  /**
   * Group logs together (wrapper for console.group)
   */
  group(label: string) {
    if (this.shouldLog('debug')) {
      // Only group if we are debugging
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
