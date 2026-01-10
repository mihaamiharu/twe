
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'content', 'challenges');
const OUTPUT_FILE = '/Users/ekkisyam/.gemini/antigravity/brain/8dee0e6d-2cbf-4b56-88ce-4177ba6d7176/available_challenges.md';

const TIERS = ['basic', 'beginner', 'intermediate', 'expert'];

async function main() {
    let mdOutput = '# Available Challenges\n\n';

    for (const tier of TIERS) {
        const filePath = join(CONTENT_DIR, `${tier}.json`);
        try {
            const content = await readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            mdOutput += `## Tier: ${tier.toUpperCase()}\n\n`;

            const challenges = data.challenges || data; // Handle if it's just an array or object with challenges prop
            const challengesList = Array.isArray(challenges) ? challenges : challenges.challenges;

            if (!challengesList) {
                mdOutput += `_No challenges found in ${tier}.json_\n\n`;
                continue;
            }

            // Group by Category
            const byCategory: Record<string, any[]> = {};
            challengesList.forEach((c: any) => {
                const cat = c.category || 'Uncategorized';
                if (!byCategory[cat]) byCategory[cat] = [];
                byCategory[cat].push(c);
            });

            for (const [category, items] of Object.entries(byCategory)) {
                mdOutput += `### Category: ${category}\n\n`;
                mdOutput += `| Title | Type | Difficulty | Slug |\n`;
                mdOutput += `|---|---|---|---|\n`;

                items.forEach((c: any) => {
                    const title = c.title?.en || c.title || 'No Title';
                    mdOutput += `| ${title} | ${c.type} | ${c.difficulty} | ${c.slug} |\n`;
                });
                mdOutput += '\n';
            }

        } catch (error) {
            console.error(`Error reading ${tier}.json:`, error);
            mdOutput += `> Error reading ${tier}.json\n\n`;
        }
    }

    await writeFile(OUTPUT_FILE, mdOutput);
    console.log(`Report written to ${OUTPUT_FILE}`);
}

main().catch(console.error);
