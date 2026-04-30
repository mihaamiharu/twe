interface TestCase {
  id: string;
  description: string;
  input: unknown;
  expectedOutput: unknown;
  isHidden?: boolean;
}

interface ServerChallengeData {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  xpReward: number;
  order: number;
  htmlContent?: string;
  files?: Record<string, string>;
  editableFiles?: string[];
  preloadModules?: Record<string, { exports: string[]; source: string }>;
  starterCode?: string;
  tags?: string[];
  hints?: string[];
  completionCount: number;
  tutorial?: { slug: string; title: string } | null;
  testCases: TestCase[];
  hiddenTestCaseCount: number;
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

interface TransformedChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xp: number;
  instructions: string;
  htmlContent: string;
  files?: Record<string, string>;
  editableFiles?: string[];
  preloadModules?: Record<string, { exports: string[]; source: string }>;
  starterCode: string;
  targetSelector: string;
  testCases: {
    id: string;
    name: string;
    input: unknown;
    expectedOutput: unknown;
  }[];
  hints?: string[];
  category: string;
  isCompleted: boolean;
  tutorial?: { slug: string; title: string } | null;
  nextChallenge?: { slug: string; title: string } | null;
  prevChallenge?: { slug: string; title: string } | null;
}

const difficultyMap: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

function extractTargetSelector(testCases: TestCase[]): string {
  if (!testCases.length) return '';

  const firstTestInput = testCases[0].input as {
    selector?: string;
    xpath?: string;
  };
  return firstTestInput?.selector || firstTestInput?.xpath || '';
}

export function transformChallengeResponse(
  data: ServerChallengeData | undefined | null,
  testCases: TestCase[],
): TransformedChallenge | null {
  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    type: data.type,
    difficulty: difficultyMap[data.difficulty] ?? 'Easy',
    xp: data.xpReward,
    instructions: data.instructions,
    htmlContent: data.htmlContent || '',
    files: data.files,
    editableFiles: data.editableFiles,
    preloadModules: data.preloadModules,
    starterCode: data.starterCode || '',
    targetSelector: extractTargetSelector(testCases),
    testCases: testCases.map((tc) => ({
      id: tc.id,
      name: tc.description,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    })),
    hints: data.hints,
    category: data.category,
    isCompleted: data.userProgress?.isCompleted || false,
    tutorial: data.tutorial,
    nextChallenge: data.nextChallenge,
    prevChallenge: data.prevChallenge,
  };
}
