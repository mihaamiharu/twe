import { z } from 'zod';
import { omitUndefined } from '@/lib/omit-undefined';
import { formatZodIssues } from '@/lib/zod-errors';
import type {
  ChallengeDefinition,
  ChallengeTierFile,
  CurriculumModuleDefinition,
  InteractionSequenceDefinition,
  LocalizedArray,
  LocalizedString,
  LocatorEvidenceDefinition,
  LocatorTargetEvidenceDefinition,
  RequiredEvidenceSequenceStep,
  SerializableExpectedStateRule,
  TestCaseDefinition,
  TypeScriptEvidenceDefinition,
  TutorialRegistry,
  TutorialRegistryEntry,
} from '@/lib/content.types';

const ContentStatusSchema = z.enum(['published', 'draft', 'coming_soon']);
const LocalizedStringSchema = z
  .object({
    en: z.string().min(1),
    id: z.string().min(1),
  })
  .strict();
const LocalizedArraySchema = z
  .object({
    en: z.array(z.string()),
    id: z.array(z.string()).optional(),
  })
  .strict();

const TutorialRegistrySchema = z
  .object({
    modules: z.array(
      z
        .object({
          slug: z.string().min(1),
          order: z.number().int().positive(),
          title: LocalizedStringSchema,
          description: LocalizedStringSchema,
          outcome: LocalizedStringSchema,
        })
        .strict(),
    ),
    tutorials: z.array(
      z
        .object({
          slug: z.string().min(1),
          order: z.number().int().positive(),
          moduleSlug: z.string().min(1),
          moduleOrder: z.number().int().positive(),
          kind: z.enum(['core', 'optional']),
          estimatedMinutes: z.number().int().positive(),
          tags: z.array(z.string()),
          practice: z
            .array(
              z
                .object({
                  slug: z.string().min(1),
                  role: z.enum(['core', 'additional']),
                })
                .strict(),
            )
            .optional(),
          status: ContentStatusSchema.optional(),
        })
        .strict(),
    ),
  })
  .strict();

const ExpectedStateSchema = z
  .object({
    selector: z.string(),
    visible: z.boolean().optional(),
    hidden: z.boolean().optional(),
    containsText: z.string().optional(),
    hasAttribute: z
      .object({
        name: z.string(),
        value: z.string().optional(),
      })
      .strict()
      .optional(),
    count: z.number().int().nonnegative().optional(),
  })
  .strict();

const ChallengeValidationPolicySchema = z
  .object({
    requireExecutedEvidence: z.boolean().optional(),
    forbidStructuralLocators: z.boolean().optional(),
    forbidForcedActions: z.boolean().optional(),
    forbidDirectDomAccess: z.boolean().optional(),
    forbidSwallowedErrors: z.boolean().optional(),
  })
  .strict();

const LocatorLeafEvidenceSchema = z
  .object({
    method: z.string().min(1),
    value: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    exact: z.boolean().optional(),
  })
  .strict();

const LocatorFilterEvidenceSchema = z
  .object({
    hasText: z.string().min(1).optional(),
    has: LocatorLeafEvidenceSchema.optional(),
  })
  .strict();

const LocatorTargetEvidenceSchema = LocatorLeafEvidenceSchema.extend({
  filters: z.array(LocatorFilterEvidenceSchema).min(1).optional(),
}).strict();

const LocatorEvidenceSchema = LocatorTargetEvidenceSchema.extend({
  scope: LocatorTargetEvidenceSchema.optional(),
}).strict();

const EvidenceArgumentSchema = z.union([z.string(), z.number(), z.boolean()]);

const RequiredEvidenceSequenceStepSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('method'),
      method: z.string().min(1),
      target: z.enum(['page', 'locator']).optional(),
      arguments: z.array(EvidenceArgumentSchema).optional(),
      locator: LocatorEvidenceSchema.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('assertion'),
      matcher: z.string().min(1),
      arguments: z.array(EvidenceArgumentSchema).optional(),
      soft: z.boolean().optional(),
      locator: LocatorEvidenceSchema.optional(),
    })
    .strict(),
]);

const TypeScriptEvidenceSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('inferred-variable'),
      name: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('variable-type'),
      name: z.string().min(1),
      annotation: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('interface-property'),
      interface: z.string().min(1),
      property: z.string().min(1),
      annotation: z.string().min(1),
      optional: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('function-parameter'),
      function: z.string().min(1),
      parameter: z.string().min(1),
      annotation: z.string().min(1),
      optional: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal('function-return'),
      function: z.string().min(1),
      annotation: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('operator'),
      operator: z.enum(['nullish-coalescing', 'strict-undefined-check']),
    })
    .strict(),
]);

const ChallengeValidationSchema = z
  .object({
    requiredAssertions: z.array(z.string().min(1)).optional(),
    requiredMethods: z.array(z.string().min(1)).optional(),
    requiredFunctionCalls: z.array(z.string().min(1)).optional(),
    requiredMemberCalls: z.array(z.string().min(1)).optional(),
    requiredAsyncFunctions: z.array(z.string().min(1)).optional(),
    requiredAwaitedFunctionCalls: z.array(z.string().min(1)).optional(),
    requiredAwaitedFunctionCallCounts: z
      .array(
        z
          .object({
            function: z.string().min(1),
            minimum: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .optional(),
    requiredFunctionMethodEvidence: z
      .array(
        z
          .object({
            function: z.string().min(1),
            methods: z.array(z.string().min(1)).min(1),
            exclusiveMethods: z.array(z.string().min(1)).min(1).optional(),
          })
          .strict()
          .superRefine((evidence, context) => {
            for (const method of evidence.exclusiveMethods ?? []) {
              if (!evidence.methods.includes(method)) {
                context.addIssue({
                  code: 'custom',
                  message: 'exclusiveMethods must also appear in methods',
                  path: ['exclusiveMethods'],
                });
              }
            }
          }),
      )
      .min(1)
      .optional(),
    requiredAwaitedMemberCalls: z.array(z.string().min(1)).optional(),
    requiredPromiseAllFunctionCalls: z.array(z.string().min(1)).optional(),
    requiredConstBindings: z.array(z.string().min(1)).optional(),
    requiredTypeScriptEvidence: z
      .array(TypeScriptEvidenceSchema)
      .min(1)
      .optional(),
    minimumConditionalBranches: z.number().int().positive().optional(),
    minimumTryCatchBlocks: z.number().int().positive().optional(),
    forbiddenMethods: z.array(z.string().min(1)).optional(),
    policy: ChallengeValidationPolicySchema.optional(),
    requiredEvidence: z
      .array(RequiredEvidenceSequenceStepSchema)
      .min(1)
      .optional(),
    requiredEvidenceSequence: z
      .array(RequiredEvidenceSequenceStepSchema)
      .min(1)
      .optional(),
    interactionSequence: z
      .object({
        event: z.literal('submit'),
        selector: z.string().min(1),
        steps: z
          .array(
            z
              .object({
                inputSelector: z.string().min(1),
                inputValue: z.string(),
                expectedState: z.array(ExpectedStateSchema).min(1),
              })
              .strict(),
          )
          .min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

const ChallengeDefinitionSchema = z
  .object({
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
    preloadModules: z
      .record(
        z.string(),
        z
          .object({
            exports: z.array(z.string()),
            source: z.string(),
          })
          .strict(),
      )
      .optional(),
    starterCode: z.string().optional(),
    testCases: z.array(
      z
        .object({
          description: z.string(),
          input: z.json().optional(),
          expectedOutput: z.json(),
          isHidden: z.boolean().optional(),
        })
        .strict(),
    ),
    solution: z.string(),
    tags: z.array(z.string()).optional(),
    status: ContentStatusSchema.optional(),
    expectedState: z.array(ExpectedStateSchema).optional(),
    validation: ChallengeValidationSchema.optional(),
  })
  .strict();

const ChallengeTierFileSchema = z
  .object({
    tier: z.enum([
      'basic',
      'beginner',
      'intermediate',
      'e2e',
      'pom',
      'typescript',
    ]),
    challenges: z.array(ChallengeDefinitionSchema),
  })
  .strict();

function normalizeLocalizedString(
  value: z.infer<typeof LocalizedStringSchema>,
): LocalizedString {
  return {
    en: value.en,
    ...omitUndefined({ id: value.id }),
  };
}

function normalizeLocalizedArray(
  value: z.infer<typeof LocalizedArraySchema>,
): LocalizedArray {
  return {
    en: value.en,
    ...omitUndefined({ id: value.id }),
  };
}

function normalizeExpectedState(
  value: z.infer<typeof ExpectedStateSchema>,
): SerializableExpectedStateRule {
  return {
    selector: value.selector,
    ...omitUndefined({
      visible: value.visible,
      hidden: value.hidden,
      containsText: value.containsText,
      count: value.count,
      hasAttribute:
        value.hasAttribute === undefined
          ? undefined
          : {
              name: value.hasAttribute.name,
              ...omitUndefined({ value: value.hasAttribute.value }),
            },
    }),
  };
}

function normalizeTestCase(
  value: z.infer<typeof ChallengeDefinitionSchema>['testCases'][number],
): TestCaseDefinition {
  return {
    description: value.description,
    ...omitUndefined({ input: value.input }),
    expectedOutput: value.expectedOutput,
    ...omitUndefined({ isHidden: value.isHidden }),
  };
}

function normalizeInteractionSequence(
  value: z.infer<typeof ChallengeValidationSchema>['interactionSequence'],
): InteractionSequenceDefinition | undefined {
  if (value === undefined) return undefined;

  return {
    event: value.event,
    selector: value.selector,
    steps: value.steps.map((step) => ({
      inputSelector: step.inputSelector,
      inputValue: step.inputValue,
      expectedState: step.expectedState.map(normalizeExpectedState),
    })),
  };
}

function normalizeRequiredEvidenceSequence(
  value: z.infer<typeof ChallengeValidationSchema>['requiredEvidenceSequence'],
): RequiredEvidenceSequenceStep[] | undefined {
  if (value === undefined) return undefined;

  return value.map((step) => {
    const locator =
      step.locator === undefined
        ? undefined
        : normalizeLocatorEvidence(step.locator);

    if (step.type === 'assertion') {
      return {
        type: step.type,
        matcher: step.matcher,
        ...omitUndefined({
          arguments: step.arguments,
          soft: step.soft,
          locator,
        }),
      };
    }

    return {
      type: step.type,
      method: step.method,
      ...omitUndefined({
        target: step.target,
        arguments: step.arguments,
        locator,
      }),
    };
  });
}

function normalizeLocatorTargetEvidence(
  value: z.infer<typeof LocatorTargetEvidenceSchema>,
): LocatorTargetEvidenceDefinition {
  return {
    method: value.method,
    ...omitUndefined({
      value: value.value,
      name: value.name,
      exact: value.exact,
      filters: value.filters?.map((filter) => ({
        ...omitUndefined({
          hasText: filter.hasText,
          has:
            filter.has === undefined
              ? undefined
              : {
                  method: filter.has.method,
                  ...omitUndefined({
                    value: filter.has.value,
                    name: filter.has.name,
                    exact: filter.has.exact,
                  }),
                },
        }),
      })),
    }),
  };
}

function normalizeLocatorEvidence(
  value: z.infer<typeof LocatorEvidenceSchema>,
): LocatorEvidenceDefinition {
  return {
    ...normalizeLocatorTargetEvidence(value),
    ...omitUndefined({
      scope:
        value.scope === undefined
          ? undefined
          : normalizeLocatorTargetEvidence(value.scope),
    }),
  };
}

function normalizeTypeScriptEvidence(
  value: z.infer<
    typeof ChallengeValidationSchema
  >['requiredTypeScriptEvidence'],
): TypeScriptEvidenceDefinition[] | undefined {
  if (value === undefined) return undefined;

  return value.map((evidence) => {
    if (evidence.type === 'interface-property') {
      return {
        type: evidence.type,
        interface: evidence.interface,
        property: evidence.property,
        annotation: evidence.annotation,
        ...omitUndefined({ optional: evidence.optional }),
      };
    }
    if (evidence.type === 'function-parameter') {
      return {
        type: evidence.type,
        function: evidence.function,
        parameter: evidence.parameter,
        annotation: evidence.annotation,
        ...omitUndefined({ optional: evidence.optional }),
      };
    }
    return evidence;
  });
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
    title: normalizeLocalizedString(value.title),
    description: normalizeLocalizedString(value.description),
    instructions: normalizeLocalizedString(value.instructions),
    ...omitUndefined({
      tutorialSlug: value.tutorialSlug,
      hints:
        value.hints === undefined
          ? undefined
          : normalizeLocalizedArray(value.hints),
      htmlContent: value.htmlContent,
      files: value.files,
      editableFiles: value.editableFiles,
      preloadModules: value.preloadModules,
      starterCode: value.starterCode,
      tags: value.tags,
      status: value.status,
      expectedState:
        value.expectedState === undefined
          ? undefined
          : value.expectedState.map(normalizeExpectedState),
      validation:
        value.validation === undefined
          ? undefined
          : {
              ...omitUndefined({
                requiredAssertions: value.validation.requiredAssertions,
                requiredMethods: value.validation.requiredMethods,
                requiredFunctionCalls: value.validation.requiredFunctionCalls,
                requiredMemberCalls: value.validation.requiredMemberCalls,
                requiredAsyncFunctions: value.validation.requiredAsyncFunctions,
                requiredAwaitedFunctionCalls:
                  value.validation.requiredAwaitedFunctionCalls,
                requiredAwaitedFunctionCallCounts:
                  value.validation.requiredAwaitedFunctionCallCounts,
                requiredFunctionMethodEvidence:
                  value.validation.requiredFunctionMethodEvidence?.map(
                    (evidence) => ({
                      function: evidence.function,
                      methods: evidence.methods,
                      ...omitUndefined({
                        exclusiveMethods: evidence.exclusiveMethods,
                      }),
                    }),
                  ),
                requiredAwaitedMemberCalls:
                  value.validation.requiredAwaitedMemberCalls,
                requiredPromiseAllFunctionCalls:
                  value.validation.requiredPromiseAllFunctionCalls,
                requiredConstBindings: value.validation.requiredConstBindings,
                requiredTypeScriptEvidence: normalizeTypeScriptEvidence(
                  value.validation.requiredTypeScriptEvidence,
                ),
                minimumConditionalBranches:
                  value.validation.minimumConditionalBranches,
                minimumTryCatchBlocks: value.validation.minimumTryCatchBlocks,
                forbiddenMethods: value.validation.forbiddenMethods,
                requiredEvidence: normalizeRequiredEvidenceSequence(
                  value.validation.requiredEvidence,
                ),
                requiredEvidenceSequence: normalizeRequiredEvidenceSequence(
                  value.validation.requiredEvidenceSequence,
                ),
                policy:
                  value.validation.policy === undefined
                    ? undefined
                    : {
                        ...omitUndefined({
                          requireExecutedEvidence:
                            value.validation.policy.requireExecutedEvidence,
                          forbidStructuralLocators:
                            value.validation.policy.forbidStructuralLocators,
                          forbidForcedActions:
                            value.validation.policy.forbidForcedActions,
                          forbidDirectDomAccess:
                            value.validation.policy.forbidDirectDomAccess,
                          forbidSwallowedErrors:
                            value.validation.policy.forbidSwallowedErrors,
                        }),
                      },
                interactionSequence: normalizeInteractionSequence(
                  value.validation.interactionSequence,
                ),
              }),
            },
    }),
    testCases: value.testCases.map(normalizeTestCase),
    solution: value.solution,
  };
}

function normalizeTutorialRegistryEntry(
  value: z.infer<typeof TutorialRegistrySchema>['tutorials'][number],
): TutorialRegistryEntry {
  return {
    slug: value.slug,
    order: value.order,
    moduleSlug: value.moduleSlug,
    moduleOrder: value.moduleOrder,
    kind: value.kind,
    estimatedMinutes: value.estimatedMinutes,
    tags: value.tags,
    ...omitUndefined({
      practice: value.practice,
      status: value.status,
    }),
  };
}

function normalizeCurriculumModule(
  value: z.infer<typeof TutorialRegistrySchema>['modules'][number],
): CurriculumModuleDefinition {
  return {
    slug: value.slug,
    order: value.order,
    title: normalizeLocalizedString(value.title),
    description: normalizeLocalizedString(value.description),
    outcome: normalizeLocalizedString(value.outcome),
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
  const result = TutorialRegistrySchema.safeParse(
    parseJson(content, sourcePath),
  );
  if (!result.success) {
    throw new Error(
      `Invalid tutorial registry in ${sourcePath}: ${formatZodIssues(result.error)}`,
    );
  }
  return {
    modules: result.data.modules.map(normalizeCurriculumModule),
    tutorials: result.data.tutorials.map(normalizeTutorialRegistryEntry),
  };
}

export function parseChallengeTierJson(
  content: string,
  sourcePath: string,
): ChallengeTierFile {
  const result = ChallengeTierFileSchema.safeParse(
    parseJson(content, sourcePath),
  );
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
