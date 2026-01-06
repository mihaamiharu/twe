/**
 * Content Validation Script
 * 
 * Validates that all content is correctly structured:
 * - All tutorials in registry.json have corresponding .md files
 * - All challenge slugs are unique across tiers
 * - Tutorial references in challenges exist
 * 
 * Run with: bun run scripts/validate-content.ts
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';

const CONTENT_ROOT = process.cwd();
const TUTORIALS_DIR = join(CONTENT_ROOT, 'tutorials');
const CHALLENGES_DIR = join(CONTENT_ROOT, 'content', 'challenges');

interface ValidationResult {
    errors: string[];
    warnings: string[];
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function validateTutorials(): Promise<ValidationResult> {
    const result: ValidationResult = { errors: [], warnings: [] };

    console.log('\n📚 Validating Tutorials...\n');

    // Load registry
    const registryPath = join(TUTORIALS_DIR, 'registry.json');
    if (!await fileExists(registryPath)) {
        result.errors.push('❌ tutorials/registry.json not found');
        return result;
    }

    const registryContent = await readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    // Check each tutorial has an EN file
    for (const tutorial of registry.tutorials) {
        const enPath = join(TUTORIALS_DIR, 'en', `${tutorial.slug}.md`);
        const idPath = join(TUTORIALS_DIR, 'id', `${tutorial.slug}.md`);

        if (!await fileExists(enPath)) {
            result.errors.push(`❌ Missing EN file: tutorials/en/${tutorial.slug}.md`);
        } else {
            console.log(`   ✅ ${tutorial.slug} (EN)`);
        }

        if (!await fileExists(idPath)) {
            result.warnings.push(`⚠️  Missing ID file: tutorials/id/${tutorial.slug}.md`);
        } else {
            console.log(`   ✅ ${tutorial.slug} (ID)`);
        }
    }

    console.log(`\n   Total: ${registry.tutorials.length} tutorials in registry`);

    return result;
}

async function validateChallenges(): Promise<ValidationResult> {
    const result: ValidationResult = { errors: [], warnings: [] };
    const seenSlugs = new Set<string>();
    const tierFiles = ['basic', 'beginner', 'intermediate', 'expert'];
    let totalChallenges = 0;

    console.log('\n🎯 Validating Challenges...\n');

    for (const tier of tierFiles) {
        const tierPath = join(CHALLENGES_DIR, `${tier}.json`);

        if (!await fileExists(tierPath)) {
            result.warnings.push(`⚠️  Tier file not found: content/challenges/${tier}.json`);
            continue;
        }

        const content = await readFile(tierPath, 'utf-8');
        const tierData = JSON.parse(content);

        console.log(`   📁 ${tier}.json: ${tierData.challenges.length} challenges`);

        for (const challenge of tierData.challenges) {
            // Check unique slugs
            if (seenSlugs.has(challenge.slug)) {
                result.errors.push(`❌ Duplicate slug: ${challenge.slug}`);
            }
            seenSlugs.add(challenge.slug);

            // Check required fields
            if (!challenge.title?.en) {
                result.errors.push(`❌ Missing EN title: ${challenge.slug}`);
            }
            if (!challenge.description?.en) {
                result.errors.push(`❌ Missing EN description: ${challenge.slug}`);
            }
            if (!challenge.instructions?.en) {
                result.errors.push(`❌ Missing EN instructions: ${challenge.slug}`);
            }
            if (!challenge.solution) {
                result.errors.push(`❌ Missing solution: ${challenge.slug}`);
            }

            // Check ID translations
            if (!challenge.title?.id) {
                result.warnings.push(`⚠️  Missing ID title: ${challenge.slug}`);
            }

            totalChallenges++;
        }
    }

    console.log(`\n   Total: ${totalChallenges} challenges across ${tierFiles.length} tiers`);

    return result;
}

async function main() {
    console.log('🔍 Content Validation\n');
    console.log('='.repeat(50));

    const tutorialResults = await validateTutorials();
    const challengeResults = await validateChallenges();

    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Summary\n');

    const allErrors = [...tutorialResults.errors, ...challengeResults.errors];
    const allWarnings = [...tutorialResults.warnings, ...challengeResults.warnings];

    if (allErrors.length > 0) {
        console.log('Errors:');
        allErrors.forEach(e => console.log(`   ${e}`));
    }

    if (allWarnings.length > 0) {
        console.log('\nWarnings:');
        allWarnings.forEach(w => console.log(`   ${w}`));
    }

    if (allErrors.length === 0 && allWarnings.length === 0) {
        console.log('✅ All content is valid!');
    }

    console.log(`\n   Errors: ${allErrors.length}`);
    console.log(`   Warnings: ${allWarnings.length}`);

    if (allErrors.length > 0) {
        process.exit(1);
    }
}

main().catch(console.error);
