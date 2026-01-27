#!/usr/bin/env bun

/**
 * Script to renumber challenge orders across all tier files
 * 
 * Order Ranges:
 * - Basic (Selectors): 1000-1999
 * - Beginner (JS/TS): 2000-2999
 * - Intermediate (Playwright Core): 3000-3999
 * - Expert (Advanced): 4000-4999
 * - E2E (App Testing): 5000-5999
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CHALLENGES_DIR = join(import.meta.dir, '../content/challenges');

interface Challenge {
  slug: string;
  category: string;
  order: number;
  [key: string]: unknown;
}

interface TierFile {
  tier: string;
  challenges: Challenge[];
}

// Category to new order base mapping
const CATEGORY_ORDER_BASE: Record<string, number> = {
  // Basic tier (1000-1999)
  'css-basics': 1000,
  'xpath-basics': 1100,
  'xpath-advanced': 1200,
  'selector-comparison': 1300,
  
  // Beginner tier (2000-2999)
  'js-fundamentals': 2000,
  'js-dom': 2100,
  'js-async': 2200,
  'ts-fundamentals': 2300,
  
  // Intermediate tier (3000-3999)
  'playwright-navigation': 3000,
  'playwright-locators': 3100,
  'playwright-assertions': 3200,
  'playwright-waits': 3300,
  
  // Expert tier (4000-4999) - WITHOUT POM and Integration (those move to E2E)
  'playwright-data-driven': 4000,
  'playwright-infrastructure': 4100,
  
  // E2E tier (5000-5999)
  'e2e-pom': 5000,
  'e2e-integration': 5100,
};

// Categories to remove from Expert tier (they're duplicated in E2E)
const EXPERT_CATEGORIES_TO_REMOVE = ['playwright-pom', 'playwright-integration-patterns'];

function processFile(filename: string): { modified: boolean; removed: number } {
  const filepath = join(CHALLENGES_DIR, filename);
  const content = readFileSync(filepath, 'utf-8');
  const data: TierFile = JSON.parse(content);
  
  let modified = false;
  let removed = 0;
  
  // For expert.json, filter out POM and Integration Patterns
  if (filename === 'expert.json') {
    const originalLength = data.challenges.length;
    data.challenges = data.challenges.filter(c => !EXPERT_CATEGORIES_TO_REMOVE.includes(c.category));
    removed = originalLength - data.challenges.length;
    if (removed > 0) {
      modified = true;
      console.log(`  Removed ${removed} challenges with categories: ${EXPERT_CATEGORIES_TO_REMOVE.join(', ')}`);
    }
  }
  
  // Group challenges by category
  const byCategory: Record<string, Challenge[]> = {};
  for (const challenge of data.challenges) {
    if (!byCategory[challenge.category]) {
      byCategory[challenge.category] = [];
    }
    byCategory[challenge.category].push(challenge);
  }
  
  // Renumber each category
  for (const [category, challenges] of Object.entries(byCategory)) {
    const baseOrder = CATEGORY_ORDER_BASE[category];
    if (baseOrder === undefined) {
      console.log(`  ⚠️  Unknown category: ${category}`);
      continue;
    }
    
    // Sort by current order to maintain relative positions
    challenges.sort((a, b) => a.order - b.order);
    
    // Assign new orders
    challenges.forEach((challenge, index) => {
      const newOrder = baseOrder + index;
      if (challenge.order !== newOrder) {
        console.log(`  ${challenge.slug}: ${challenge.order} → ${newOrder}`);
        challenge.order = newOrder;
        modified = true;
      }
    });
  }
  
  if (modified) {
    // Sort all challenges by new order before writing
    data.challenges.sort((a, b) => a.order - b.order);
    writeFileSync(filepath, JSON.stringify(data, null, 4) + '\n');
  }
  
  return { modified, removed };
}

console.log('=== Renumbering Challenge Orders ===\n');

const files = ['basic.json', 'beginner.json', 'typescript.json', 'intermediate.json', 'expert.json', 'e2e.json'];

let totalModified = 0;
let totalRemoved = 0;

for (const file of files) {
  console.log(`Processing ${file}...`);
  const result = processFile(file);
  if (result.modified) {
    totalModified++;
  }
  totalRemoved += result.removed;
}

console.log(`\n✅ Done! Modified ${totalModified} files, removed ${totalRemoved} challenges.`);
