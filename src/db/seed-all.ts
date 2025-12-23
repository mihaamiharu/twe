/**
 * Unified Seed Script for Staging Environment
 * 
 * Runs all seed scripts in the correct order to populate the database
 * with complete tutorials and challenges.
 * 
 * Run with: bun run db:seed:all
 */

import { execSync } from 'child_process';

const seedScripts = [
    'src/db/seed-tutorials.ts',
    'src/db/seed-basic-challenges.ts',
    'src/db/seed-beginner-challenges.ts',
    'src/db/seed-intermediate-challenges.ts',
    'src/db/seed-expert-challenges.ts',
    'src/db/seed-achievements.ts',
];

async function runAllSeeds() {
    console.log('🌱 Running all seed scripts for staging environment...\n');

    for (const script of seedScripts) {
        console.log(`\n📦 Running ${script}...`);
        console.log('─'.repeat(50));

        try {
            execSync(`bun run ${script}`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`\n❌ Failed to run ${script}`);
            process.exit(1);
        }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('✨ All seeds completed successfully!');
    console.log('═'.repeat(50));
}

runAllSeeds();
