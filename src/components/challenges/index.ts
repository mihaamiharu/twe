/**
 * Challenge Components
 *
 * Export all challenge-related components.
 */

export { CodeEditor } from './CodeEditor';
export type { CodeEditorProps } from './CodeEditor';

export { SelectorInput } from './SelectorInput';
export type {
  SelectorInputProps,
  SelectorType,
  SelectorValidationResult,
} from './SelectorInput';

export { WebComponentPreview } from './WebComponentPreview';
export type { WebComponentPreviewProps } from './WebComponentPreview';

export { TestResults } from './TestResults';
export type { TestResult, TestResultsProps } from './TestResults';

export * from './ChallengeSkeleton';
export { ChallengeCard } from './ChallengeCard';
export type {
  ChallengeCardProps,
  ChallengeType,
  Difficulty,
} from './ChallengeCard';

export { ChallengePlayground } from './ChallengePlayground';
export type {
  Challenge,
  ChallengePlaygroundProps,
} from './ChallengePlayground';
