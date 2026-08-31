import { beforeEach, describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { omitUndefined } from '../../lib/omit-undefined';
import type {
    ChallengeValidationDefinition,
    SerializableExpectedStateRule,
} from '../../lib/content.types';
import {
    testSelectorAgainstTarget,
    validateSelector,
} from '../../core/executor/selector-validator';
import { executePlaywrightCode } from '../../core/executor/iframe-executor';
import { validateChallengeExecution } from '../../core/executor/challenge-validator';

const localizedTextSchema = z.object({
    en: z.string(),
    id: z.string().optional(),
});
const expectedStateRuleSchema = z.object({
    selector: z.string(),
    visible: z.boolean().optional(),
    hidden: z.boolean().optional(),
    containsText: z.string().optional(),
    count: z.number().optional(),
    hasAttribute: z
        .object({ name: z.string(), value: z.string().optional() })
        .optional(),
});
const validationSchema = z
    .object({
        requiredAssertions: z.array(z.string()).optional(),
        requiredMethods: z.array(z.string()).optional(),
        forbiddenMethods: z.array(z.string()).optional(),
        policy: z
            .object({
                requireExecutedEvidence: z.boolean().optional(),
                forbidStructuralLocators: z.boolean().optional(),
                forbidForcedActions: z.boolean().optional(),
                forbidDirectDomAccess: z.boolean().optional(),
                forbidSwallowedErrors: z.boolean().optional(),
            })
            .optional(),
        interactionSequence: z
            .object({
                event: z.literal('submit'),
                selector: z.string(),
                steps: z.array(
                    z.object({
                        inputSelector: z.string(),
                        inputValue: z.string(),
                        expectedState: z.array(expectedStateRuleSchema),
                    }),
                ),
            })
            .optional(),
    })
    .optional();

function normalizeExpectedStateRule(
    rule: z.infer<typeof expectedStateRuleSchema>,
): SerializableExpectedStateRule {
    return {
        ...omitUndefined({
            selector: rule.selector,
            visible: rule.visible,
            hidden: rule.hidden,
            containsText: rule.containsText,
            count: rule.count,
        }),
        ...(rule.hasAttribute === undefined
            ? {}
            : {
                  hasAttribute: omitUndefined({
                      name: rule.hasAttribute.name,
                      value: rule.hasAttribute.value,
                  }),
              }),
    };
}

function normalizeValidation(
    validation: z.infer<typeof validationSchema>,
): ChallengeValidationDefinition | undefined {
    if (validation === undefined) return undefined;

    return {
        ...omitUndefined({
            requiredAssertions: validation.requiredAssertions,
            requiredMethods: validation.requiredMethods,
            forbiddenMethods: validation.forbiddenMethods,
        }),
        ...(validation.policy === undefined
            ? {}
            : {
                  policy: omitUndefined({
                      requireExecutedEvidence:
                          validation.policy.requireExecutedEvidence,
                      forbidStructuralLocators:
                          validation.policy.forbidStructuralLocators,
                      forbidForcedActions: validation.policy.forbidForcedActions,
                      forbidDirectDomAccess:
                          validation.policy.forbidDirectDomAccess,
                      forbidSwallowedErrors:
                          validation.policy.forbidSwallowedErrors,
                  }),
              }),
        ...(validation.interactionSequence === undefined
            ? {}
            : {
                  interactionSequence: {
                      event: validation.interactionSequence.event,
                      selector: validation.interactionSequence.selector,
                      steps: validation.interactionSequence.steps.map((step) => ({
                          inputSelector: step.inputSelector,
                          inputValue: step.inputValue,
                          expectedState: step.expectedState.map(
                              normalizeExpectedStateRule,
                          ),
                      })),
                          },
                      }),
    };
}
const tierDataSchema = z.object({
    tier: z.string(),
    challenges: z.array(
        z.object({
            slug: z.string(),
            type: z.string(),
            difficulty: z.string(),
            title: localizedTextSchema,
            description: localizedTextSchema,
            instructions: localizedTextSchema,
            htmlContent: z.string().optional(),
            starterCode: z.string(),
            solution: z.string(),
            files: z.record(z.string(), z.string()).optional(),
            preloadModules: z
                .record(
                    z.string(),
                    z.object({
                        exports: z.array(z.string()),
                        source: z.string(),
                    }),
                )
                .optional(),
            expectedState: z
                .array(
                    z.object({
                        selector: z.string(),
                        visible: z.boolean().optional(),
                        hidden: z.boolean().optional(),
                        containsText: z.string().optional(),
                        count: z.number().optional(),
                        hasAttribute: z
                            .object({
                                name: z.string(),
                                value: z.string().optional(),
                            })
                            .optional(),
                    }),
                )
                .optional(),
            validation: validationSchema,
            testCases: z.array(
                z.object({
                    description: z.string(),
                    expectedOutput: z.union([
                        z.string(),
                        z.object({
                            selector: z.string().optional(),
                            matchCount: z.number().optional(),
                            targetElementId: z.string().optional(),
                        }),
                    ]),
                    isHidden: z.boolean(),
                }),
            ),
        }),
    ),
});

const CHALLENGE_FILES = [
    'beginner.json',
    'basic.json',
    'intermediate.json',
    'e2e.json',
];

const CONTENT_DIR = join(process.cwd(), 'content', 'challenges');

describe('Challenge Integrity & Solutions', () => {
    CHALLENGE_FILES.forEach((file) => {
        const filePath = join(CONTENT_DIR, file);
        const content = readFileSync(filePath, 'utf-8');
        const parsed: unknown = JSON.parse(content);
        const data = tierDataSchema.parse(parsed);

        describe(`${data.tier} tier (${file})`, () => {
            data.challenges.forEach((challenge) => {
                describe(`Challenge: ${challenge.slug}`, () => {
                    it('should have valid metadata', () => {
                        expect(challenge.slug).toBeTruthy();
                        expect(challenge.type).toBeTruthy();
                        expect(challenge.title.en).toBeTruthy();
                        expect(challenge.description.en).toBeTruthy();
                        expect(challenge.instructions.en).toBeTruthy();

                        // E2E/Playwright challenges might not have htmlContent as they use full app
                        if (challenge.type !== 'PLAYWRIGHT') {
                            expect(challenge.htmlContent).toBeTruthy();
                        }

                        if (challenge.type !== 'PLAYWRIGHT') {
                            expect(challenge.testCases.length).toBeGreaterThan(
                                0,
                            );
                        }
                        expect(challenge.solution).toBeTruthy();
                    });

                    if (
                        challenge.type === 'CSS_SELECTOR' ||
                        challenge.type === 'XPATH_SELECTOR'
                    ) {
                        it('should give correct feedback for the solution', () => {
                            const selectorType =
                                challenge.type === 'CSS_SELECTOR'
                                    ? 'css'
                                    : 'xpath';
                            if (challenge.htmlContent === undefined) {
                                throw new Error(
                                    `${challenge.slug} is missing selector HTML content`,
                                );
                            }
                            const { htmlContent } = challenge;

                            if (
                                selectorType === 'xpath' &&
                                typeof document.evaluate === 'undefined'
                            ) {
                                return;
                            }

                            const container = document.createElement('div');
                            container.innerHTML = htmlContent;

                            // Ensure container is attached to document for some selectors to work (like :root, etc, though usually not needed for simple ones)
                            document.body.appendChild(container);

                            // Validate validation logic first
                            const validation = validateSelector(
                                challenge.solution,
                                selectorType,
                            );
                            expect(validation.isValid).toBe(true);

                            // Get expectation (either a selector or an ID)
                            const testCase = challenge.testCases[0];
                            if (!testCase) {
                                throw new Error(
                                    `${challenge.slug} has no test case`,
                                );
                            }
                            const expectedOutput = testCase.expectedOutput;

                            let expectedSelector = '';
                            const targetId = undefined;

                            if (typeof expectedOutput === 'object') {
                                if (expectedOutput.selector) {
                                    expectedSelector = expectedOutput.selector;
                                }
                            } else {
                                expectedSelector = String(expectedOutput);
                            }

                            if (!expectedSelector && challenge.solution) {
                                expectedSelector = challenge.solution;
                            }

                            const result = testSelectorAgainstTarget(
                                challenge.solution,
                                selectorType,
                                container,
                                expectedSelector,
                                targetId,
                            );

                            if (!result.isCorrect) {
                                console.error(`\nFAILED: ${challenge.slug}`);
                                console.error(
                                    `Solution: "${challenge.solution}"`,
                                );
                                console.error(
                                    `Expected: "${expectedSelector}"`,
                                );
                                console.error(
                                    `HTML: ${htmlContent.substring(0, 100)}...`,
                                );
                                console.error(
                                    `User Matches: ${result.userMatchCount}`,
                                );
                                console.error(
                                    `Expected Matches: ${result.expectedMatchCount}`,
                                );
                                console.error(`Feedback: ${result.feedback}`);
                            }

                            expect(result.isCorrect).toBe(true);

                            document.body.removeChild(container);
                        });
                    }
                });
            });
        });
    });
});

const tutorialRegistrySchema = z.object({
    tutorials: z.array(
        z.object({
            moduleSlug: z.string(),
            practice: z
                .array(
                    z.object({
                        slug: z.string(),
                        role: z.enum(['core', 'additional']),
                    }),
                )
                .optional(),
        }),
    ),
});

const challengeCatalog = CHALLENGE_FILES.flatMap((file) => {
    const content = readFileSync(join(CONTENT_DIR, file), 'utf-8');
    return tierDataSchema.parse(JSON.parse(content)).challenges;
});

const tutorialRegistry = tutorialRegistrySchema.parse(
    JSON.parse(
        readFileSync(
            join(process.cwd(), 'tutorials', 'registry.json'),
            'utf-8',
        ),
    ),
);

const corePracticeSlugs = new Set(
    tutorialRegistry.tutorials.flatMap((tutorial) =>
        (tutorial.practice ?? [])
            .filter((reference) => reference.role === 'core')
            .map((reference) => reference.slug),
    ),
);

const revisedModuleSlugs = new Set([
    'actions-sync',
    'assertions-test-design',
    'reliability-debugging',
    'maintainable-suites',
]);

const revisedModulePracticeSlugs = tutorialRegistry.tutorials
    .filter((tutorial) => revisedModuleSlugs.has(tutorial.moduleSlug))
    .flatMap((tutorial) =>
        (tutorial.practice ?? []).map((reference) => reference.slug),
    );

const requiredRuntimePracticeSlugs = new Set([
    ...corePracticeSlugs,
    ...revisedModulePracticeSlugs,
]);

const requiredRuntimePlaywrightChallenges = challengeCatalog
    .filter(
        (challenge) =>
            challenge.type === 'PLAYWRIGHT' &&
            requiredRuntimePracticeSlugs.has(challenge.slug),
    )
    .sort(
        (left, right) =>
            Number(Boolean(right.preloadModules)) -
            Number(Boolean(left.preloadModules)),
    );

describe('Required Learn and revised-module Playwright reference solutions', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    for (const challenge of requiredRuntimePlaywrightChallenges) {
        it(`${challenge.slug} satisfies its runtime contract`, async () => {
            const files = challenge.files ?? {};
            const preloadCode = challenge.preloadModules
                ? Object.values(challenge.preloadModules)
                      .map((module) => {
                          const source = files[module.source];
                          if (source === undefined) {
                              throw new Error(
                                  `${challenge.slug}: missing preload source ${module.source}`,
                              );
                          }
                          return source
                              .replace(/^import\s+.*?;?$/gm, '')
                              .replace(/^export\s+/gm, '');
                      })
                      .join('\n')
                : '';
            const initialHtml = challenge.files
                ? (challenge.files['/index.html'] ?? '<div></div>')
                : (challenge.htmlContent ?? '<div></div>');
            const expectedState = challenge.expectedState?.map((rule) => ({
                selector: rule.selector,
                ...(rule.visible === undefined
                    ? {}
                    : { visible: rule.visible }),
                ...(rule.hidden === undefined ? {} : { hidden: rule.hidden }),
                ...(rule.containsText === undefined
                    ? {}
                    : { containsText: rule.containsText }),
                ...(rule.count === undefined ? {} : { count: rule.count }),
                ...(rule.hasAttribute === undefined
                    ? {}
                    : {
                          hasAttribute: {
                              name: rule.hasAttribute.name,
                              ...(rule.hasAttribute.value === undefined
                                  ? {}
                                  : { value: rule.hasAttribute.value }),
                      },
                  }),
            }));
            const validation = normalizeValidation(challenge.validation);

            const result = await executePlaywrightCode(
                `${preloadCode}\n${challenge.solution}`,
                initialHtml,
                {
                    timeout: 10_000,
                    ...(challenge.files === undefined
                        ? {}
                        : { files: challenge.files }),
                    ...(expectedState === undefined ? {} : { expectedState }),
                    ...(validation === undefined
                        ? {}
                        : {
                              validation,
                          }),
                    ...(validation?.interactionSequence === undefined
                        ? {}
                        : {
                              interactionSequence:
                                  validation.interactionSequence,
                          }),
                    strictMode: true,
                    // Reference solutions intentionally use JavaScript-compatible
                    // TypeScript so the Bun DOM harness does not need browser WASM.
                    isTypeScript: false,
                },
            );

            if (result.status !== 'PASSED') {
                throw new Error(`${challenge.slug}: ${result.output}`);
            }

            if (validation !== undefined) {
                expect(
                    validateChallengeExecution(result, validation),
                ).toEqual({ passed: true });
            }
        });
    }
});
