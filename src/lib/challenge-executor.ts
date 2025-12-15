/**
 * Challenge Executor
 * 
 * Main entry point for challenge execution functionality.
 */

export { MockedPlaywrightPage } from './playwright-shim';
export type { Locator, LocatorOptions, WaitOptions } from './playwright-shim';

export {
    executePlaywrightCode,
    executeWithTestCases,
    createPreviewIframe
} from './iframe-executor';
export type {
    ExecutionResult,
    ExecuteOptions,
    TestCase,
    TestCaseResult
} from './iframe-executor';
