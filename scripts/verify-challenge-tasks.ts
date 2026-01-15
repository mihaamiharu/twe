
import fs from 'fs';
import path from 'path';

// Define types for Challenge structure
interface Challenge {
    slug: string;
    order: number;
    instructions?: {
        en?: string;
        id?: string;
    };
    starterCode?: string;
    testCases?: unknown[];
}

interface ChallengeContent {
    challenges: Challenge[];
}

const contentDir = path.join(process.cwd(), 'content/challenges');
const files = ['basic.json', 'beginner.json', 'intermediate.json', 'expert.json'];

console.log('Verifying Challenge Tasks...');

files.forEach(file => {
    const filePath = path.join(contentDir, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(filePath)) return;

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const content = JSON.parse(rawContent) as ChallengeContent;
    const challenges = content.challenges || [];
    console.log(`Processing ${file}: ${challenges.length} challenges found.`);

    challenges.forEach((challenge: Challenge) => {
        const instructions = challenge.instructions?.en || '';
        let foundHeader = 'NONE';
        if (instructions.includes('## Your Task')) foundHeader = 'Your Task';
        else if (instructions.includes('## Your Mission')) foundHeader = 'Your Mission';
        else if (instructions.includes('## The Challenge')) foundHeader = 'The Challenge (Potential Issue)';

        if (foundHeader === 'NONE' || foundHeader === 'The Challenge (Potential Issue)') {
            console.log(`[WEAK TASK HEADER] File: ${file} | Slug: ${challenge.slug} | Header: ${foundHeader}`);
        }

        // Check for Test Cases
        if (!challenge.testCases || challenge.testCases.length === 0) {
            console.log(`[NO TEST CASES] File: ${file} | Slug: ${challenge.slug}`);
        }

        // Check for empty task content
        if (foundHeader !== 'NONE' && foundHeader !== 'The Challenge (Potential Issue)') {
            const taskIndex = instructions.indexOf('## ' + foundHeader);
            const contentAfterTask = instructions.substring(taskIndex + foundHeader.length + 3).trim();
            if (contentAfterTask.length < 10) {
                console.log(`[EMPTY TASK CONTENT] File: ${file} | Slug: ${challenge.slug} | Content Length: ${contentAfterTask.length}`);
            }
            // Check for list items
            if (!contentAfterTask.includes('1.') && !contentAfterTask.includes('- ')) {
                console.log(`[NO LIST IN TASK] File: ${file} | Slug: ${challenge.slug}`);
            }
        }

        // Check for Real World Scenario
        if (!instructions.includes('## Real World Scenario')) {
            console.log(`[MISSING EN SCENARIO] File: ${file} | Slug: ${challenge.slug}`);
        }
        const instructionsIdContent = challenge.instructions?.id || '';
        if (!instructionsIdContent.includes('## Skenario Dunia Nyata')) {
            console.log(`[MISSING ID SCENARIO] File: ${file} | Slug: ${challenge.slug}`);
        }

        // Check for empty starterCode (except basic.json)
        if (file !== 'basic.json' && (!challenge.starterCode || challenge.starterCode.trim() === '')) {
            console.log(`[EMPTY STARTER CODE] File: ${file} | Slug: ${challenge.slug}`);
        }

        const hasTask = instructions.includes('## Your Task') || instructions.includes('## Your Mission') || instructions.includes('## The Challenge');

        // Also check ID
        const instructionsId = challenge.instructions?.id || '';
        const hasTaskId = instructionsId.includes('## Tugas Kamu') || instructionsId.includes('## Misi Kamu') || instructionsId.includes('## Tantangannya');

        if (!hasTask) {
            console.log(`[MISSING EN TASK] File: ${file} | Slug: ${challenge.slug} | Order: ${challenge.order}`);
        }
        if (!hasTaskId) {
            console.log(`[MISSING ID TASK] File: ${file} | Slug: ${challenge.slug} | Order: ${challenge.order}`);
        }
    });
});
console.log('Verification Complete.');
