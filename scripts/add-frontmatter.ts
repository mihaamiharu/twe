/**
 * Add Frontmatter to Tutorials
 *
 * Extracts title and description from tutorial markdown files
 * and adds YAML frontmatter to the beginning.
 *
 * Run with: bun run scripts/add-frontmatter.ts
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const TUTORIALS_EN_DIR = join(process.cwd(), 'tutorials', 'en');

async function extractMetadata(
  content: string,
): Promise<{ title: string; description: string }> {
  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || 'Untitled';

  // Extract description from first paragraph after H1
  const descMatch = content.match(/^#[^\n]+\n+([^\n#]+)/);
  let description = descMatch?.[1]?.trim() || '';

  // Clean up description (remove markdown formatting)
  description = description
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove code
    .slice(0, 200); // Limit length

  return { title, description };
}

function hasFrontmatter(content: string): boolean {
  return content.startsWith('---\n');
}

async function addFrontmatter(filePath: string): Promise<boolean> {
  const content = await readFile(filePath, 'utf-8');

  // Skip if already has frontmatter
  if (hasFrontmatter(content)) {
    return false;
  }

  const { title, description } = await extractMetadata(content);

  const frontmatter = `---
title: "${title}"
description: "${description}"
---

`;

  const newContent = frontmatter + content;
  await writeFile(filePath, newContent, 'utf-8');

  return true;
}

async function main() {
  console.log('📝 Adding frontmatter to tutorials...\n');

  const files = await readdir(TUTORIALS_EN_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  let added = 0;
  let skipped = 0;

  for (const file of mdFiles) {
    const filePath = join(TUTORIALS_EN_DIR, file);
    const wasAdded = await addFrontmatter(filePath);

    if (wasAdded) {
      console.log(`   ✅ Added: ${file}`);
      added++;
    } else {
      console.log(`   ⏭️  Skipped (already has frontmatter): ${file}`);
      skipped++;
    }
  }

  console.log(`\n✨ Done! Added: ${added}, Skipped: ${skipped}`);
}

main().catch(console.error);
