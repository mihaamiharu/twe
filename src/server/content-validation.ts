import { z } from 'zod';
import { formatZodIssues } from '@/lib/zod-errors';
import type {
  ChallengeDefinition,
  ChallengeTierFile,
  ExpectedStateRule,
  LocalizedArray,
  LocalizedString,
  TestCaseDefinition,
  TutorialRegistry,
  TutorialRegistryEntry,
} from '@/lib/content.types';

const ContentStatusSchema = z.enum(['published', 'draft', 'coming_soon']);
const LocalizedStringSchema = z.object({
  en: z.string(),
  id: z.string().optional(),
}).strict();
const LocalizedArraySchema = z.object({
  en: z.array(z.string()),
  id: z.array(z.string()).optional(),
}).strict();

const TutorialRegistrySchema = z.object({
  tutorials: z.array(z.object({
    slug: z.string().min(1),
    order: z.number(),
    estimatedMinutes: z.number(),
    tags: z.array(z.string()),
    relatedChallenges: z.array(z.string()).optional(),
    nextTutorialSlug: z.string().nullable().optional(),
    status: ContentStatusSchema.optional(),
  }).strict()),
}).strict();

const ExpectedStateSchema = z.object({
  selector: z.string(),
  visible: z.boolean().optional(),
  hidden: z.boolean().optional(),
  containsText: z.string().optional(),
  hasAttribute: z.object({
    name: z.string(),
    value: z.string().optional(),
  }).strict().optional(),
  count: z.number().int().nonnegative().optional(),
}).strict();

const ChallengeDefinitionSchema = z.object({
  slug: z.string().min(1),
  type: z.enum([
    'CSS_SELECTOR',
    'XPATH_SELECTOR',
    'JAVASCRIPT',
    'TYPESCRIPT',
    'PLAYWRIGHT',
  ]),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.string(),
  xpReward: z.number(),
  order: z.number(),
  tutorialSlug: z.string().optional(),
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,
  instructions: LocalizedStringSchema,
  hints: LocalizedArraySchema.optional(),
  htmlContent: z.string().optional(),
  files: z.record(z.string(), z.string()).optional(),
  editableFiles: z.array(z.string()).optional(),
  preloadModules: z.record(
    z.string(),
    z.object({
      exports: z.array(z.string()),
      source: z.string(),
    }).strict(),
  ).optional(),
  starterCode: z.string().optional(),
  testCases: z.array(z.object({
    description: z.string(),
    input: z.json().optional(),
    expectedOutput: z.json(),
    isHidden: z.boolean().optional(),
  }).strict()),
  solution: z.string(),
  tags: z.array(z.string()).optional(),
  status: ContentStatusSchema.optional(),
  expectedState: z.array(ExpectedStateSchema).optional(),
}).strict();

const ChallengeTierFileSchema = z.object({
  tier: z.enum([
    'basic',
    'beginner',
    'intermediate',
    'e2e',
    'pom',
    'typescript',
  ]),
  challenges: z.array(ChallengeDefinitionSchema),
}).strict();

function normalizeLocalizedString(
  value: z.infer<typeof LocalizedStringSchema>,
): LocalizedString {
  return {
    en: value.en,
    ...(value.id === undefined ? {} : { id: value.id }),
  };
}

function normalizeLocalizedArray(
  value: z.infer<typeof LocalizedArraySchema>,
): LocalizedArray {
  return {
    en: value.en,
    ...(value.id === undefined ? {} : { id: value.id }),
  };
}

function normalizeExpectedState(
  value: z.infer<typeof ExpectedStateSchema>,
): ExpectedStateRule {
  return {
    selector: value.selector,
    ...(value.visible === undefined ? {} : { visible: value.visible }),
    ...(value.hidden === undefined ? {} : { hidden: value.hidden }),
    ...(value.containsText === undefined ? {} : { containsText: value.containsText }),
    ...(value.hasAttribute === undefined
      ? {}
      : {
          hasAttribute: {
            name: value.hasAttribute.name,
            ...(value.hasAttribute.value === undefined
              ? {}
              : { value: value.hasAttribute.value }),
          },
        }),
    ...(value.count === undefined ? {} : { count: value.count }),
  };
}

function normalizeTestCase(
  value: z.infer<typeof ChallengeDefinitionSchema>['testCases'][number],
): TestCaseDefinition {
  return {
    description: value.description,
    ...(value.input === undefined ? {} : { input: value.input }),
    expectedOutput: value.expectedOutput,
    ...(value.isHidden === undefined ? {} : { isHidden: value.isHidden }),
  };
}

function normalizeChallengeDefinition(
  value: z.infer<typeof ChallengeDefinitionSchema>,
): ChallengeDefinition {
  return {
    slug: value.slug,
    type: value.type,
    difficulty: value.difficulty,
    category: value.category,
    xpReward: value.xpReward,
    order: value.order,
    ...(value.tutorialSlug === undefined ? {} : { tutorialSlug: value.tutorialSlug }),
    title: normalizeLocalizedString(value.title),
    description: normalizeLocalizedString(value.description),
    instructions: normalizeLocalizedString(value.instructions),
    ...(value.hints === undefined ? {} : { hints: normalizeLocalizedArray(value.hints) }),
    ...(value.htmlContent === undefined ? {} : { htmlContent: value.htmlContent }),
    ...(value.files === undefined ? {} : { files: value.files }),
    ...(value.editableFiles === undefined ? {} : { editableFiles: value.editableFiles }),
    ...(value.preloadModules === undefined ? {} : { preloadModules: value.preloadModules }),
    ...(value.starterCode === undefined ? {} : { starterCode: value.starterCode }),
    testCases: value.testCases.map(normalizeTestCase),
    solution: value.solution,
    ...(value.tags === undefined ? {} : { tags: value.tags }),
    ...(value.status === undefined ? {} : { status: value.status }),
    ...(value.expectedState === undefined
      ? {}
      : { expectedState: value.expectedState.map(normalizeExpectedState) }),
  };
}

function normalizeTutorialRegistryEntry(
  value: z.infer<typeof TutorialRegistrySchema>['tutorials'][number],
): TutorialRegistryEntry {
  return {
    slug: value.slug,
    order: value.order,
    estimatedMinutes: value.estimatedMinutes,
    tags: value.tags,
    ...(value.relatedChallenges === undefined
      ? {}
      : { relatedChallenges: value.relatedChallenges }),
    ...(value.nextTutorialSlug === undefined
      ? {}
      : { nextTutorialSlug: value.nextTutorialSlug }),
    ...(value.status === undefined ? {} : { status: value.status }),
  };
}

function parseJson(content: string, sourcePath: string): unknown {
  try {
    const parsed: unknown = JSON.parse(content);
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(`Invalid JSON in ${sourcePath}${detail}`, { cause: error });
  }
}

export function parseTutorialRegistryJson(
  content: string,
  sourcePath: string,
): TutorialRegistry {
  const result = TutorialRegistrySchema.safeParse(parseJson(content, sourcePath));
  if (!result.success) {
    throw new Error(
      `Invalid tutorial registry in ${sourcePath}: ${formatZodIssues(result.error)}`,
    );
  }
  return {
    tutorials: result.data.tutorials.map(normalizeTutorialRegistryEntry),
  };
}

export function parseChallengeTierJson(
  content: string,
  sourcePath: string,
): ChallengeTierFile {
  const result = ChallengeTierFileSchema.safeParse(parseJson(content, sourcePath));
  if (!result.success) {
    throw new Error(
      `Invalid challenge tier in ${sourcePath}: ${formatZodIssues(result.error)}`,
    );
  }
  return {
    tier: result.data.tier,
    challenges: result.data.challenges.map(normalizeChallengeDefinition),
  };
}
