import { omitUndefined } from './omit-undefined';

export type MarkdownDocument = {
  meta: { title?: string; description?: string };
  content: string;
};

/** Shared by catalog projection and build-time OG metadata generation. */
export function parseFrontmatter(content: string): MarkdownDocument {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const descriptionMatch = content.match(/^#[^\n]+\n+([^\n#]+)/);
    return {
      meta: omitUndefined({
        title: titleMatch?.[1]?.trim(),
        description: descriptionMatch?.[1]?.trim(),
      }),
      content,
    };
  }
  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];
  if (frontmatter === undefined || body === undefined)
    return { meta: {}, content };
  const meta: MarkdownDocument['meta'] = {};
  for (const line of frontmatter.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;
    let value = valueParts.join(':').trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    if (key.trim() === 'title') meta.title = value;
    if (key.trim() === 'description') meta.description = value;
  }
  return { meta, content: body.trim() };
}
