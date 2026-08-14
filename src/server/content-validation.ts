import { z } from 'zod';
import type {
  ChallengeTierFile,
  TutorialRegistry,
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

function parseJson(content: string, sourcePath: string): unknown {
  try {
    const parsed: unknown = JSON.parse(content);
    return parsed;
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(`Invalid JSON in ${sourcePath}${detail}`, { cause: error });
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
    return `${path}: ${issue.message}`;
  }).join('; ');
}

export function parseTutorialRegistryJson(
  content: string,
  sourcePath: string,
): TutorialRegistry {
  const result = TutorialRegistrySchema.safeParse(parseJson(content, sourcePath));
  if (!result.success) {
    throw new Error(
      `Invalid tutorial registry in ${sourcePath}: ${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

export function parseChallengeTierJson(
  content: string,
  sourcePath: string,
): ChallengeTierFile {
  const result = ChallengeTierFileSchema.safeParse(parseJson(content, sourcePath));
  if (!result.success) {
    throw new Error(
      `Invalid challenge tier in ${sourcePath}: ${formatIssues(result.error)}`,
    );
  }
  return result.data;
}
