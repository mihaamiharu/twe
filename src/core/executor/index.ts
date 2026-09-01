/**
 * Challenge Executor
 *
 * Main entry point for challenge execution functionality.
 */

export { MockedPlaywrightPage } from './playwright-shim';
export type { Locator, LocatorOptions, WaitOptions } from './shim.types';

export {
  executePlaywrightCode,
  executeWithTestCases,
  createPreviewIframe,
} from './iframe-executor';
export {
  analyzeSourcePolicy,
} from './source-policy-analyzer';
export {
  createRuntimeExecutionTrace,
  createTracedPlaywrightPage,
} from './runtime-trace';
export {
  PLAYWRIGHT_ACTION_METHODS,
  PLAYWRIGHT_LOCATOR_METHODS,
  PLAYWRIGHT_LOCATOR_RETURNING_METHODS,
  PLAYWRIGHT_PAGE_METHODS,
} from './playwright-methods';
export { validateChallengeExecution } from './challenge-validator';
export type {
  ExecutionResult,
  ExecuteOptions,
  TestCase,
  TestCaseResult,
} from './executor.types';
export type {
  SourcePolicyAnalysis,
} from './source-policy-analyzer';
export type {
  RuntimeAssertion,
  RuntimeExecutionTrace,
  RuntimeMethodCall,
  RuntimeTraceTarget,
} from './runtime-trace';
export type {
  ChallengeValidationDecision,
  ChallengeValidationFailure,
  ChallengeValidationFailureKind,
} from './challenge-validator';
