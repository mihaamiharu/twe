import { describe, test, expect, beforeAll } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Ensure DOM exists
if (typeof document === 'undefined') {
    GlobalRegistrator.register();
}

import { cssChallenges, xpathChallenges, comparisonChallenges } from '../db/seed-basic-challenges';
import { jsFundamentalsChallenges, domChallenges, asyncChallenges } from '../db/seed-beginner-challenges';
import { navigationChallenges, locatorChallenges, assertionChallenges, waitChallenges } from '../db/seed-intermediate-challenges';
import { pomChallenges, dataDrivenChallenges, advancedPatternsChallenges } from '../db/seed-expert-challenges';
import { KNOWN_SOLUTIONS } from './fixtures/solutions';
import { executePlaywrightCode } from '../lib/iframe-executor';

// Flatten all challenges
const allChallenges = [
    ...cssChallenges,
    ...xpathChallenges,
    ...comparisonChallenges,
    ...jsFundamentalsChallenges,
    ...domChallenges,
    ...asyncChallenges,
    ...navigationChallenges,
    ...locatorChallenges,
    ...assertionChallenges,
    ...waitChallenges,
    ...pomChallenges,
    ...dataDrivenChallenges,
    ...advancedPatternsChallenges
];

console.log(`Verifying ${allChallenges.length} challenges...`);

describe('Challenge Verification', () => {

    // Happy-DOM doesn't support these CSS pseudo-classes, skip them in tests
    const SKIP_CSS_CHALLENGES = [
        'css-validation-states',  // Uses :invalid
        'css-forms-boss',         // Uses :optional
    ];

    describe('CSS Selector Challenges', () => {
        const cssItems = allChallenges
            .filter(c => c.type === 'CSS_SELECTOR')
            .filter(c => !SKIP_CSS_CHALLENGES.includes(c.slug));

        test.each(cssItems)('$title ($slug)', (challenge) => {
            // Setup DOM
            document.body.innerHTML = challenge.htmlContent || '';

            // Verify target selector finds something
            if (challenge.targetSelector) {
                const element = document.querySelector(challenge.targetSelector);
                expect(element).not.toBeNull();
            }
        });
    });

    // XPath evaluation is limited in many JSDOM/HappyDOM environments
    // We will do a basic structure check for XPath challenges
    describe('XPath Selector Challenges', () => {
        const xpathItems = allChallenges.filter(c => c.type === 'XPATH_SELECTOR');

        test.each(xpathItems)('$title ($slug)', (challenge) => {
            expect(challenge.htmlContent).toBeDefined();
            expect(challenge.targetSelector).toBeDefined();
            expect(challenge.targetSelector?.startsWith('//') || challenge.targetSelector?.startsWith('/')).toBe(true);
        });
    });

    describe('Code Challenges (JS & Playwright)', () => {
        const codeItems = allChallenges.filter(c => c.type === 'JAVASCRIPT' || c.type === 'PLAYWRIGHT');

        test.each(codeItems)('$title ($slug)', async (challenge) => {
            // Basic smoke test: Check assertions exist
            expect(challenge.instructions).toBeDefined();
            expect(challenge.starterCode).toBeDefined();
            expect(challenge.expectedOutput).toBeDefined(); // Most have expected output logic

            // Check if we have a known solution for full verification
            // This is "Integration" level verification where we would run the code
            if (KNOWN_SOLUTIONS[challenge.slug]) {
                const solutionCode = KNOWN_SOLUTIONS[challenge.slug];
                const htmlContent = challenge.htmlContent || '';

                // Execute the solution code
                const result = await executePlaywrightCode(solutionCode, htmlContent, { timeout: 10000 });

                if (result.status !== 'PASSED') {
                    console.error(`Challenge ${challenge.slug} failed: ${result.error}`);
                    if (result.logs && result.logs.length > 0) {
                        console.log('--- Iframe Logs ---');
                        result.logs.forEach(log => console.log(`[${log.type}] ${log.message}`));
                        console.log('-------------------');
                    }
                }

                expect(result.status).toBe('PASSED');
                expect(result.error).toBeUndefined();
            }
        }, 15000);
    });
});
