import type {
  ChallengeDifficulty,
  ChallengeType,
  TestCaseDefinition,
} from './content.types';

/**
 * Filesystem-backed editorial data exposed to Learn and Practice reads.
 *
 * A slug is the stable identity shared by the filesystem and database. The
 * catalog contracts intentionally do not contain persistence or user state.
 */

export interface TutorialCatalogListItem {
  slug: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  tags: string[];
  relatedChallenges: string[];
}

export interface TutorialCatalogDetail extends TutorialCatalogListItem {
  content: string;
}

export type TutorialCatalogList = TutorialCatalogListItem[];

export interface ChallengeCatalogListItem {
  slug: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  category: string;
  xpReward: number;
  order: number;
  title: string;
  description: string;
  tags: string[];
  tutorialSlug?: string;
}

export interface ChallengeCatalogDetail extends ChallengeCatalogListItem {
  instructions: string;
  hints: string[];
  htmlContent?: string;
  files?: Record<string, string>;
  editableFiles?: string[];
  preloadModules?: Record<string, { exports: string[]; source: string }>;
  starterCode?: string;
  testCases: TestCaseDefinition[];
  solution: string;
}

export type ChallengeCatalogList = ChallengeCatalogListItem[];

export interface CatalogFailure {
  success: false;
  error: string;
}

export interface TutorialListCatalogResponse {
  success: true;
  data: Array<
    TutorialCatalogListItem & {
      id: string;
      isPublished: boolean;
      viewCount: number;
      isCompleted: boolean;
      readingProgress: number;
    }
  >;
  meta: { availableTags: string[] };
  pagination: {
    page: 1;
    limit: number;
    total: number;
    totalPages: 1;
  };
}

export interface ChallengeListCatalogResponse {
  success: true;
  data: Array<
    ChallengeCatalogListItem & {
      id: string;
      isPublished: boolean;
      completionCount: number;
      isCompleted: boolean;
    }
  >;
  pagination: {
    page: 1;
    limit: number;
    total: number;
    totalPages: 1;
  };
}

export type TutorialListResponse = TutorialListCatalogResponse | CatalogFailure;
export type ChallengeListResponse =
  | ChallengeListCatalogResponse
  | CatalogFailure;
