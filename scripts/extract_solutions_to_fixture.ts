import fs from 'node:fs';
import path from 'node:path';

const solutionsPath = path.resolve(process.cwd(), 'docs/solutions.md');
const outputPath = path.resolve(process.cwd(), 'e2e/fixtures/solutions.json');

const content = fs.readFileSync(solutionsPath, 'utf-8');
const lines = content.split('\n');

const solutions: Record<string, string> = {};
let currentSlug: string | null = null;
let currentCode: string[] = [];
let inCodeBlock = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.trim().startsWith('#### ')) {
    // Save previous if exists
    if (currentSlug && currentCode.length > 0) {
      solutions[currentSlug] = currentCode.join('\n').trim();
    }

    currentSlug = line.replace('#### ', '').trim();
    // Remove (Legacy App) or other suffix if present? No, looks like slugs are clean mostly.
    // There are some headers like "#### css-foundations-boss (Legacy App)"?
    // Let's check the glossaries.
    // "#### css-foundations-boss"
    // "#### js-fundamentals-boss (JS Architect)" -> slug is js-fundamentals-boss

    if (currentSlug.includes('(')) {
      currentSlug = currentSlug.split('(')[0].trim();
    }

    currentCode = [];
    inCodeBlock = false;
    continue;
  }

  if (!currentSlug) continue;

  if (line.trim().startsWith('```javascript')) {
    inCodeBlock = true;
    continue;
  }

  if (line.trim().startsWith('```') && inCodeBlock) {
    inCodeBlock = false;
    continue;
  }

  if (inCodeBlock) {
    currentCode.push(line);
    continue;
  }

  // Handle inline code `...` for selectors
  if (line.trim().startsWith('`') && !line.trim().startsWith('```')) {
    // It might be `selector` or `selector`
    // Extract text between backticks
    const match = line.match(/^`([^`]+)`/);
    if (match) {
      currentCode.push(match[1]);
    }
  }
}

// Save last one
if (currentSlug && currentCode.length > 0) {
  solutions[currentSlug] = currentCode.join('\n').trim();
}

console.log(`Extracted ${Object.keys(solutions).length} solutions.`);
fs.writeFileSync(outputPath, JSON.stringify(solutions, null, 2));
