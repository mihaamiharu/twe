import fs from 'node:fs';
import path from 'node:path';

const challengesDir = path.resolve(process.cwd(), 'content/challenges');
const outputPath = path.resolve(process.cwd(), 'docs/solutions.md');

interface Challenge {
    slug: string;
    type: string;
    title: { en: string; id: string };
    solution?: string;
}

interface ChallengeTier {
    tier: string;
    challenges: Challenge[];
}

function generateMarkdown() {
    const files = fs.readdirSync(challengesDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));

    let markdown = '# Challenge Solutions Reference\n\n';
    markdown += 'This document contains the **official solutions** for all coding challenges, extracted directly from the challenge definitions.\n\n---\n\n## Table of Contents\n\n';

    const tiers: ChallengeTier[] = [];

    for (const file of files) {
        const filePath = path.join(challengesDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ChallengeTier;
        tiers.push(content);
    }

    // Sort tiers if needed, for now just use them
    // Map tier names to display names
    const tierDisplayNames: Record<string, string> = {
        basic: 'Basic Tier',
        beginner: 'Beginner Tier',
        intermediate: 'Intermediate Tier',
        typescript: 'TypeScript Tier',
        e2e: 'E2E Tier',
    };

    // Sort challenges by order or hierarchy? The JSONs have "order" field.
    // But let's keep it simple first.

    for (const tier of tiers) {
        const displayName = tierDisplayNames[tier.tier] || tier.tier;
        markdown += `- [${displayName}](#${tier.tier}-tier)\n`;
    }

    markdown += '\n---\n\n';

    for (const tier of tiers) {
        const displayName = tierDisplayNames[tier.tier] || tier.tier;
        markdown += `## ${displayName}\n\n`;

        for (const challenge of tier.challenges) {
            if (!challenge.solution) continue;

            markdown += `### ${challenge.slug} - ${challenge.title.en}\n\n`;

            const lang = getLanguage(challenge.type);
            markdown += `\`\`\`${lang}\n${challenge.solution}\n\`\`\`\n\n`;
        }

        markdown += '---\n\n';
    }

    fs.writeFileSync(outputPath, markdown);
    console.log(`Generated ${outputPath} successfully.`);
}

function getLanguage(type: string): string {
    switch (type) {
        case 'CSS_SELECTOR': return 'css';
        case 'XPATH': return 'xpath';
        case 'JAVASCRIPT':
        case 'DOM':
        case 'ASYNC':
        case 'PLAYWRIGHT':
        case 'E2E':
            return 'javascript';
        case 'TYPESCRIPT': return 'typescript';
        default: return 'text';
    }
}

generateMarkdown();
