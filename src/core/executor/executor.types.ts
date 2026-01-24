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
        toBe: (expected: unknown) => void;
        toBeVisible: () => Promise<void>;
        toBeHidden: () => Promise<void>;
        toHaveText: (text: string | RegExp) => Promise<void>;
        toHaveValue: (value: string) => Promise<void>;
        toContainText: (text: string) => Promise<void>;
        toHaveAttribute: (name: string, value?: string | RegExp) => Promise<void>;
        toHaveCount: (count: number) => Promise<void>;
        not: {
            toBeVisible: () => Promise<void>;
            toBeHidden: () => Promise<void>;
            toHaveText: (text: string | RegExp) => Promise<void>;
            toContainText: (text: string) => Promise<void>;
            toBeChecked: () => Promise<void>;
            toBeEnabled: () => Promise<void>;
            toBeDisabled: () => Promise<void>;
            toBeFocused: () => Promise<void>;
            toBeEmpty: () => Promise<void>;
        };
    }) & {
        soft: (actual: unknown) => any;
    };
    getAssertionCount: () => number;
    getTestResults: () => Array<{ message: string; passed: boolean }>;
}
