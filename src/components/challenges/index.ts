/**
 * Challenge Components
 *
 * Export all challenge-related components.
 */

export { CodeEditor } from './code-editor';
export type { CodeEditorProps } from './code-editor';

export { SelectorInput } from './selector-input';
export type {
  SelectorInputProps,
  SelectorType,
  SelectorValidationResult,
} from './selector-input';

export { WebComponentPreview } from './web-component-preview';
export type { WebComponentPreviewProps } from './web-component-preview';

export { TestResults } from './test-results';
export type { TestResult, TestResultsProps } from './test-results';

export * from './challenge-skeleton';
export { ChallengeCard } from './challenge-card';
export type {
  ChallengeCardProps,
  ChallengeType,
  Difficulty,
} from './challenge-card';

export { ChallengePlayground } from './challenge-playground';
export type {
  Challenge,
  ChallengePlaygroundProps,
} from './challenge-playground';
