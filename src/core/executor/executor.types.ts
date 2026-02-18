import { MockedPlaywrightPage } from './playwright-shim';
import type { ExpectedStateRule } from '@/lib/content.types';

export interface ExecutionResult {
    status: 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';
    output: string;
    executionTime: number;
    error?: string;
    returnValue?: unknown;
    logs?: Array<{ id: string; type: string; message: string }>;
    assertionCount?: number;
}

export interface ExecuteOptions {
    timeout?: number;
    testCases?: TestCase[];
    cssContent?: string;
    files?: Record<string, string>; // VFS: multi-page content for E2E challenges
    onNavigate?: (path: string) => void; // Callback for URL bar updates
    expectedState?: ExpectedStateRule[]; // DOM validation rules
    isTypeScript?: boolean;
}

export interface TestCase {
    id: string;
    name: string;
    validate: (page: MockedPlaywrightPage) => Promise<boolean>;
}

export interface TestCaseResult {
    id: string;
    name: string;
    passed: boolean;
    error?: string;
}

export interface ExpectResult {
    expect: ((actual: unknown) => {
        // Generic Assertions
        toBe: (expected: unknown) => Promise<void>;
        toEqual: (expected: unknown) => Promise<void>;
        toBeTruthy: () => Promise<void>;
        toBeFalsy: () => Promise<void>;
        toBeNull: () => Promise<void>;
        toBeUndefined: () => Promise<void>;
        toBeDefined: () => Promise<void>;
        toBeGreaterThan: (expected: number) => Promise<void>;
        toBeGreaterThanOrEqual: (expected: number) => Promise<void>;
        toBeLessThan: (expected: number) => Promise<void>;
        toBeLessThanOrEqual: (expected: number) => Promise<void>;
        toBeCloseTo: (expected: number, precision?: number) => Promise<void>;
        toContain: (expected: any) => Promise<void>;
        toHaveLength: (expected: number) => Promise<void>;
        toMatch: (expected: string | RegExp) => Promise<void>;
        toHaveProperty: (path: string, value?: any) => Promise<void>;

        // Locator Assertions
        toBeVisible: (options?: { timeout?: number }) => Promise<void>;
        toBeHidden: (options?: { timeout?: number }) => Promise<void>;
        toHaveText: (text: string | RegExp, options?: { timeout?: number }) => Promise<void>;
        toHaveValue: (value: string | RegExp, options?: { timeout?: number }) => Promise<void>;
        toContainText: (text: string, options?: { timeout?: number }) => Promise<void>;
        toHaveAttribute: (name: string, value?: string | RegExp, options?: { timeout?: number }) => Promise<void>;
        toHaveCount: (count: number, options?: { timeout?: number }) => Promise<void>;
        toBeChecked: (options?: { timeout?: number }) => Promise<void>;
        toBeEnabled: (options?: { timeout?: number }) => Promise<void>;
        toBeDisabled: (options?: { timeout?: number }) => Promise<void>;
        toBeEditable: (options?: { timeout?: number }) => Promise<void>;
        toBeFocused: (options?: { timeout?: number }) => Promise<void>;
        toBeEmpty: (options?: { timeout?: number }) => Promise<void>;
        toHaveTitle: (title: string | RegExp, options?: { timeout?: number }) => Promise<void>;
        toHaveURL: (url: string | RegExp, options?: { timeout?: number }) => Promise<void>;
        toHaveClass: (className: string | RegExp, options?: { timeout?: number }) => Promise<void>;

        not: any; // Simplified for brevity in type definition, implementation handles it
    }) & {
        soft: (actual: unknown) => any;
    };
    getAssertionCount: () => number;
    getTestResults: () => Array<{ message: string; passed: boolean }>;
}
