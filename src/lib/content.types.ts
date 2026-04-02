/**
 * Content Types for Filesystem-Driven Content Management
 *
 * These types define the structure of tutorials and challenges
 * defined when loaded from the filesystem (JSON/Markdown).
 */

 import {
   type LocalizedString,
   type ChallengeType,
   type ChallengeDifficulty,
   type TestCaseDefinition,
   type ExpectedStateRule,
 } from './validations';

 export type {
   LocalizedString,
   ChallengeType,
   ChallengeDifficulty,
   TestCaseDefinition,
   ExpectedStateRule,
 };
 // =============================================================================
 // CONTENT STATUS
 // =============================================================================

 export type ContentStatus = 'published' | 'draft' | 'coming_soon';

 // =============================================================================
 // LOCALIZED CONTENT
 // =============================================================================

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

export type ChallengeTier = 'basic' | 'beginner' | 'intermediate' | 'e2e' | 'pom' | 'typescript';

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
export interface BaseChallenge {
  id?: string;
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

/**
 * Challenge item for list views (lighter weight)
 */
export interface ChallengeListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  category: string;
  xpReward: number;
  order: number;
  tags: string[];
  completionCount: number;
  isCompleted: boolean;
}

/**
 * Complete challenge detail with related data (from getChallenge)
 */
export interface Challenge extends BaseChallenge {
  id: string;
  hiddenTestCaseCount: number;
  tutorial?: { slug: string; title: string } | null;
  userProgress?: {
    isCompleted: boolean;
    attempts: number;
    lastAccessedAt: Date;
    usedHint: boolean;
    hintContent?: string | null;
  } | null;
  bestSubmission?: {
    code: string;
    isPassed: boolean;
    xpEarned: number;
    testsPassed: number;
    testsTotal: number;
    executionTime: number;
  } | null;
  nextChallenge?: { slug: string; title: string } | null;
  prevChallenge?: { slug: string; title: string } | null;
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

// =============================================================================
// GAMIFICATION TYPES
// =============================================================================

export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Achievement {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  rarity: AchievementRarity;
  category: string;
  requirementType: string;
  requirementValue: number;
  xpReward: number;
  isSecret: boolean;
  createdAt: Date;
  // Joined fields
  unlockCount?: number;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  // Joined fields
  achievement?: Achievement;
}
