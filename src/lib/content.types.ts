/**
 * Content Types for Filesystem-Driven Content Management
 *
 * These types define the structure of tutorials and challenges
 * when loaded from the filesystem (JSON/Markdown).
 */

// =============================================================================
// CONTENT STATUS
// =============================================================================

export type ContentStatus = 'published' | 'draft' | 'coming_soon';

// =============================================================================
// LOCALIZED CONTENT
// =============================================================================

export interface LocalizedString {
  en: string;
  id?: string;
}

export interface LocalizedArray {
  en: string[];
  id?: string[];
}

export type CurriculumItemKind = 'core' | 'optional';
export type PracticeRole = 'core' | 'additional';

export interface CurriculumModuleDefinition {
  slug: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  outcome: LocalizedString;
}

export interface TutorialPracticeReference {
  slug: string;
  role: PracticeRole;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// =============================================================================
// TUTORIAL TYPES
// =============================================================================

/**
 * Tutorial metadata from registry.json
 */
export interface TutorialRegistryEntry {
  slug: string;
  order: number;
  moduleSlug: string;
  moduleOrder: number;
  kind: CurriculumItemKind;
  estimatedMinutes: number;
  tags: string[];
  practice?: TutorialPracticeReference[];
  status?: ContentStatus;
}

/**
 * Tutorial registry file structure
 */
export interface TutorialRegistry {
  modules: CurriculumModuleDefinition[];
  tutorials: TutorialRegistryEntry[];
}

/**
 * Frontmatter parsed from tutorial markdown files
 */
export interface TutorialFrontmatter {
  title: string;
  description: string;
}

/**
 * Complete tutorial with content (after loading from filesystem)
 */
export interface Tutorial {
  slug: string;
  title: string;
  description: string;
  content: string;
  order: number;
  moduleSlug: string;
  moduleOrder: number;
  kind: CurriculumItemKind;
  estimatedMinutes: number;
  tags: string[];
  practice: TutorialPracticeReference[];
}

// =============================================================================
// CHALLENGE TYPES
// =============================================================================

export type ChallengeType =
  | 'CSS_SELECTOR'
  | 'XPATH_SELECTOR'
  | 'JAVASCRIPT'
  | 'TYPESCRIPT'
  | 'PLAYWRIGHT';
export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ChallengeTier =
  | 'basic'
  | 'beginner'
  | 'intermediate'
  | 'e2e'
  | 'pom'
  | 'typescript';

/**
 * Test case definition in challenge JSON
 */
export interface TestCaseDefinition {
  description: string;
  input?: JsonValue;
  expectedOutput: JsonValue;
  isHidden?: boolean;
}

/**
 * Expected state rule for DOM validation after code execution
 */
export interface ExpectedStateRule {
  selector: string;
  visible?: boolean;
  hidden?: boolean;
  containsText?: string;
  hasAttribute?: { name: string; value?: string | RegExp };
  count?: number;
}

export type SerializableExpectedStateRule = Omit<
  ExpectedStateRule,
  'hasAttribute'
> & {
  hasAttribute?: { name: string; value?: string };
};

export interface InteractionSequenceStep {
  inputSelector: string;
  inputValue: string;
  expectedState: SerializableExpectedStateRule[];
}

export interface InteractionSequenceDefinition {
  event: 'submit';
  selector: string;
  steps: InteractionSequenceStep[];
}

export interface LocatorEvidenceDefinition {
  method: string;
  value?: string;
  name?: string;
}

export type RequiredEvidenceSequenceStep =
  | {
      type: 'method';
      method: string;
      target?: 'page' | 'locator';
      arguments?: string[];
      locator?: LocatorEvidenceDefinition;
    }
  | {
      type: 'assertion';
      matcher: string;
      locator?: LocatorEvidenceDefinition;
    };

export interface ChallengeValidationPolicy {
  /** Require required methods and assertions to be observed at runtime. */
  requireExecutedEvidence?: boolean;
  /** Reject page/locator.locator() structural selector calls. */
  forbidStructuralLocators?: boolean;
  /** Reject action options whose runtime force value is truthy. */
  forbidForcedActions?: boolean;
  /** Reject direct document/window/globalThis DOM access. */
  forbidDirectDomAccess?: boolean;
  /** Reject catch handlers that suppress failures instead of rethrowing. */
  forbidSwallowedErrors?: boolean;
}

export interface ChallengeValidationDefinition {
  requiredAssertions?: string[];
  requiredMethods?: string[];
  /** Require named free-function calls in learner source. */
  requiredFunctionCalls?: string[];
  /** Require named member calls such as Array.prototype.filter. */
  requiredMemberCalls?: string[];
  /** Require these learner bindings to be declared with const. */
  requiredConstBindings?: string[];
  /** Require at least one conditional chain with this many branches. */
  minimumConditionalBranches?: number;
  forbiddenMethods?: string[];
  policy?: ChallengeValidationPolicy;
  interactionSequence?: InteractionSequenceDefinition;
  /** Require successful runtime evidence to occur in this order. */
  requiredEvidenceSequence?: RequiredEvidenceSequenceStep[];
}

/**
 * Challenge definition from tier JSON files
 */
export interface ChallengeDefinition {
  slug: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  category: string;
  xpReward: number;
  order: number;
  tutorialSlug?: string;
  title: LocalizedString;
  description: LocalizedString;
  instructions: LocalizedString;
  hints?: LocalizedArray;
  htmlContent?: string;
  files?: Record<string, string>; // VFS: multi-page content for E2E
  editableFiles?: string[]; // Which files user can edit (default: all)
  preloadModules?: Record<
    string,
    {
      exports: string[]; // e.g., ["LoginPage", "DashboardPage"]
      source: string; // e.g., "/pages/LoginPage.ts"
    }
  >;
  starterCode?: string;
  testCases: TestCaseDefinition[];
  solution: string;
  tags?: string[];
  status?: ContentStatus;
  expectedState?: ExpectedStateRule[]; // DOM state validation rules
  validation?: ChallengeValidationDefinition;
}

/**
 * Challenge tier file structure
 */
export interface ChallengeTierFile {
  tier: ChallengeTier;
  challenges: ChallengeDefinition[];
}

/**
 * Challenge with localized strings resolved (for UI consumption)
 */
export interface Challenge {
  slug: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  category: string;
  xpReward: number;
  order: number;
  tutorialSlug?: string;
  title: string;
  description: string;
  instructions: string;
  hints?: string[];
  htmlContent?: string;
  files?: Record<string, string>; // VFS: multi-page content for E2E
  editableFiles?: string[]; // Which files user can edit (default: all)
  preloadModules?: Record<
    string,
    {
      exports: string[]; // e.g., ["LoginPage", "DashboardPage"]
      source: string; // e.g., "/pages/LoginPage.ts"
    }
  >;
  starterCode?: string;
  testCases: TestCaseDefinition[];
  solution: string;
  tags?: string[];
  expectedState?: ExpectedStateRule[]; // DOM state validation rules
  validation?: ChallengeValidationDefinition;
  // Dynamic fields (from DB)
  completionCount?: number;
  isCompleted?: boolean;
}

// =============================================================================
// CONTENT SERVICE TYPES
// =============================================================================

export interface TutorialFilters {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface ChallengeFilters {
  type?: ChallengeType;
  difficulty?: ChallengeDifficulty;
  tier?: ChallengeTier;
  category?: string;
  search?: string;
}
