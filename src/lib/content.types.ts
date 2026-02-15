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

// =============================================================================
// TUTORIAL TYPES
// =============================================================================

/**
 * Tutorial metadata from registry.json
 */
export interface TutorialRegistryEntry {
  slug: string;
  order: number;
  estimatedMinutes: number;
  tags: string[];
  relatedChallenges?: string[];
  nextTutorialSlug?: string | null;
  status?: ContentStatus;
}

/**
 * Tutorial registry file structure
 */
export interface TutorialRegistry {
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
  estimatedMinutes: number;
  tags: string[];
  relatedChallenges?: string[];
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
export type ChallengeTier = 'basic' | 'beginner' | 'intermediate' | 'e2e' | 'pom' | 'typescript';

/**
 * Test case definition in challenge JSON
 */
export interface TestCaseDefinition {
  description: string;
  input?: unknown;
  expectedOutput: unknown;
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
  preloadModules?: Record<string, {
    exports: string[];      // e.g., ["LoginPage", "DashboardPage"]
    source: string;         // e.g., "/pages/LoginPage.ts"
  }>;
  starterCode?: string;
  testCases: TestCaseDefinition[];
  solution: string;
  tags?: string[];
  status?: ContentStatus;
  expectedState?: ExpectedStateRule[]; // DOM state validation rules
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
  preloadModules?: Record<string, {
    exports: string[];      // e.g., ["LoginPage", "DashboardPage"]
    source: string;         // e.g., "/pages/LoginPage.ts"
  }>;
  starterCode?: string;
  testCases: TestCaseDefinition[];
  solution: string;
  tags?: string[];
  expectedState?: ExpectedStateRule[]; // DOM state validation rules
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
