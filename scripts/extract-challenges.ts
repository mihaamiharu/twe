/**
 * Challenge Extraction Script
 * 
 * Extracts challenge data from TypeScript seeder files and converts them
 * to the new JSON format for filesystem-driven content management.
 * 
 * Run with: bun run scripts/extract-challenges.ts
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

// Import all challenge arrays from seeders
import { cssChallenges, xpathChallenges, comparisonChallenges } from '../src/db/seed-basic-challenges';
import { jsFundamentalsChallenges, domChallenges, asyncChallenges } from '../src/db/seed-beginner-challenges';
import { navigationChallenges, locatorChallenges, assertionChallenges, waitChallenges } from '../src/db/seed-intermediate-challenges';
import { pomChallenges, dataDrivenChallenges, advancedPatternsChallenges } from '../src/db/seed-expert-challenges';

const CHALLENGES_DIR = join(process.cwd(), 'content', 'challenges');

interface LocalizedString {
    en: string;
    id?: string;
}

interface TestCase {
    description: string;
    expectedOutput: unknown;
    isHidden: boolean;
}

interface ChallengeJSON {
    slug: string;
    type: string;
    difficulty: string;
    category: string;
    xpReward: number;
    order: number;
    tutorialSlug?: string;
    title: LocalizedString;
    description: LocalizedString;
    instructions: LocalizedString;
    htmlContent?: string;
    starterCode?: string;
    testCases: TestCase[];
    solution: string;
    tags?: string[];
}

function convertChallenge(challenge: any): ChallengeJSON {
    // Determine solution based on challenge type
    let solution = '';
    if (challenge.targetSelector) {
        solution = challenge.targetSelector;
    } else if (challenge.expectedOutput !== undefined) {
        solution = String(challenge.expectedOutput);
    } else {
        // For assertion/pattern challenges without explicit solutions,
        // use starterCode hint or a placeholder
        solution = 'PATTERN_CHALLENGE';
    }

    // Create test cases based on challenge type
    const testCases: TestCase[] = [];
    if (challenge.type === 'CSS_SELECTOR' || challenge.type === 'XPATH_SELECTOR') {
        testCases.push({
            description: `Selects the target element`,
            expectedOutput: { selector: challenge.targetSelector, matchCount: 1 },
            isHidden: false,
        });
    } else {
        // JavaScript/Playwright challenges
        testCases.push({
            description: `Returns the expected output`,
            expectedOutput: challenge.expectedOutput,
            isHidden: false,
        });
    }

    return {
        slug: challenge.slug,
        type: challenge.type,
        difficulty: challenge.difficulty,
        category: challenge.category,
        xpReward: challenge.xpReward,
        order: challenge.order,
        tutorialSlug: undefined,
        title: {
            en: challenge.title,
        },
        description: {
            en: challenge.description,
        },
        instructions: {
            en: challenge.instructions,
        },
        htmlContent: challenge.htmlContent,
        starterCode: challenge.starterCode || '',
        testCases,
        solution,
        tags: challenge.tags,
    };
}

async function extractTier(
    tierName: string,
    challengeArrays: any[][],
    filename: string
): Promise<number> {
    const allChallenges = challengeArrays.flat().map(convertChallenge);

    const tierData = {
        tier: tierName,
        challenges: allChallenges,
    };

    await writeFile(
        join(CHALLENGES_DIR, filename),
        JSON.stringify(tierData, null, 2),
        'utf-8'
    );

    return allChallenges.length;
}

async function main() {
    console.log('🔄 Extracting challenges from seeders...\n');

    // Basic tier (CSS/XPath)
    console.log('📁 Processing basic tier...');
    const basicCount = await extractTier(
        'basic',
        [cssChallenges, xpathChallenges, comparisonChallenges],
        'basic.json'
    );
    console.log(`   ✅ Wrote ${basicCount} challenges to basic.json`);

    // Beginner tier (JavaScript fundamentals)
    console.log('📁 Processing beginner tier...');
    const beginnerCount = await extractTier(
        'beginner',
        [jsFundamentalsChallenges, domChallenges, asyncChallenges],
        'beginner.json'
    );
    console.log(`   ✅ Wrote ${beginnerCount} challenges to beginner.json`);

    // Intermediate tier (Playwright basics)
    console.log('📁 Processing intermediate tier...');
    const intermediateCount = await extractTier(
        'intermediate',
        [navigationChallenges, locatorChallenges, assertionChallenges, waitChallenges],
        'intermediate.json'
    );
    console.log(`   ✅ Wrote ${intermediateCount} challenges to intermediate.json`);

    // Expert tier (Advanced patterns)
    console.log('📁 Processing expert tier...');
    const expertCount = await extractTier(
        'expert',
        [pomChallenges, dataDrivenChallenges, advancedPatternsChallenges],
        'expert.json'
    );
    console.log(`   ✅ Wrote ${expertCount} challenges to expert.json`);

    const total = basicCount + beginnerCount + intermediateCount + expertCount;
    console.log(`\n✨ Extraction complete! Total: ${total} challenges`);
}

main().catch(console.error);
