import { getRuntimeEnv } from '#platform';
import { logger } from '@/lib/logger';
import { formatZodIssues } from '@/lib/zod-errors';
import { z } from 'zod';

interface CreateIssueParams {
  title: string;
  body: string;
  labels?: string[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
}

const GitHubIssueSchema = z
  .object({
    id: z.number().int(),
    number: z.number().int(),
    html_url: z.string().url(),
    title: z.string(),
    state: z.enum(['open', 'closed']),
  })
  .passthrough();

export function parseGitHubIssueResponse(
  value: unknown,
  repository: string,
): GitHubIssue {
  const result = GitHubIssueSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `[GitHub] Invalid create-issue response for ${repository}: ${formatZodIssues(result.error)}`,
    );
  }
  return result.data;
}

/**
 * Create a GitHub issue using the GitHub REST API
 * @param params Issue details (title, body, labels)
 * @returns The created issue or null if failed
 */
export async function createGitHubIssue(
  params: CreateIssueParams,
): Promise<GitHubIssue | null> {
  const token = getRuntimeEnv().GH_API_TOKEN;
  const owner = getRuntimeEnv().GH_OWNER;
  const repo = getRuntimeEnv().GH_REPO;

  if (!token || !owner || !repo) {
    logger.warn(
      '[GitHub] Missing configuration. GH_API_TOKEN, GH_OWNER, and GH_REPO are required.',
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          'User-Agent': 'TestingWithEkki',
        },
        body: JSON.stringify({
          title: params.title,
          body: params.body,
          labels: params.labels || ['bug'],
        }),
      },
    );

    if (!response.ok) {
      await response.body?.cancel();
      logger.error(
        `[GitHub] Failed to create issue. Status: ${response.status}.`,
      );
      return null;
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      throw new Error(
        `[GitHub] Invalid JSON response while creating issue for ${owner}/${repo}`,
        { cause: error },
      );
    }
    const issue = parseGitHubIssueResponse(responseBody, `${owner}/${repo}`);
    logger.info(`[GitHub] Issue created successfully: ${issue.html_url}`);
    return issue;
  } catch {
    logger.error('[GitHub] Error creating issue.');
    return null;
  }
}

/**
 * Format bug report data into a Markdown body for GitHub Issues
 */
export function formatBugReportBody(data: {
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  pageUrl?: string | null;
  browserInfo?: string | null;
  reporterEmail?: string | null;
  reportId: string;
  userId?: string | null;
}): string {
  return `### Description
${data.actualBehavior}

### Steps to Reproduce
${data.stepsToReproduce}

### Expected Behavior
${data.expectedBehavior}

### Context
- **Page**: ${data.pageUrl || 'N/A'}
- **Browser**: ${data.browserInfo || 'N/A'}
- **Reporter**: ${data.reporterEmail || 'Anonymous'} ${data.userId ? `(ID: ${data.userId})` : ''}
- **Report ID**: ${data.reportId}
`;
}
