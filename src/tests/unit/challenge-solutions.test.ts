import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import {
    testSelectorAgainstTarget,
    validateSelector,
} from '../../core/executor/selector-validator';

const localizedTextSchema = z.object({
    en: z.string(),
    id: z.string().optional(),
});
const tierDataSchema = z.object({
    tier: z.string(),
    challenges: z.array(z.object({
        slug: z.string(),
        type: z.string(),
        difficulty: z.string(),
        title: localizedTextSchema,
        description: localizedTextSchema,
        instructions: localizedTextSchema,
        htmlContent: z.string().optional(),
        starterCode: z.string(),
        solution: z.string(),
        testCases: z.array(z.object({
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
        })),
    })),
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
                            expect(challenge.testCases.length).toBeGreaterThan(0);
                        }
                        expect(challenge.solution).toBeTruthy();
                    });

                    if (
                        challenge.type === 'CSS_SELECTOR' ||
                        challenge.type === 'XPATH_SELECTOR'
                    ) {
                        it('should give correct feedback for the solution', () => {
                            const selectorType =
                                challenge.type === 'CSS_SELECTOR' ? 'css' : 'xpath';
                            if (challenge.htmlContent === undefined) {
                                throw new Error(`${challenge.slug} is missing selector HTML content`);
                            }
                            const { htmlContent } = challenge;

                            if (selectorType === 'xpath' && typeof document.evaluate === 'undefined') {
                                return;
                            }

                            const container = document.createElement('div');
                            container.innerHTML = htmlContent;

                            // Ensure container is attached to document for some selectors to work (like :root, etc, though usually not needed for simple ones)
                            document.body.appendChild(container);

                            // Validate validation logic first
                            const validation = validateSelector(challenge.solution, selectorType);
                            expect(validation.isValid).toBe(true);

                            // Get expectation (either a selector or an ID)
                            const testCase = challenge.testCases[0];
                            if (!testCase) {
                                throw new Error(`${challenge.slug} has no test case`);
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
                                targetId
                            );

                            if (!result.isCorrect) {
                                console.error(`\nFAILED: ${challenge.slug}`);
                                console.error(`Solution: "${challenge.solution}"`);
                                console.error(`Expected: "${expectedSelector}"`);
                                console.error(`HTML: ${htmlContent.substring(0, 100)}...`);
                                console.error(`User Matches: ${result.userMatchCount}`);
                                console.error(`Expected Matches: ${result.expectedMatchCount}`);
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
