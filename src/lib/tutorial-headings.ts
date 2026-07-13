export interface TutorialHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyTutorialHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\w]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractTutorialHeadings(content: string): TutorialHeading[] {
  const headings: TutorialHeading[] = [];
  let inCodeBlock = false;

  for (const line of content.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    headings.push({ id: slugifyTutorialHeading(text), text, level });
  }

  return headings;
}
