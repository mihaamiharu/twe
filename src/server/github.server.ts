import { getRuntimeEnv } from '#platform';
import { logger } from '@/lib/logger';
import { formatZodIssues } from '@/lib/zod-errors';
import { z } from 'zod';
import { sanitizeBugReportPageUrl } from '@/lib/bug-report-privacy';

const GitHubTargetSchema = z.object({
  token: z.string().min(1),
  owner: z
    .string()
    .min(1)
    .max(39)
    .regex(/^[A-Za-z0-9-]+$/)
    .refine((value) => !value.startsWith('-') && !value.endsWith('-')),
  repo: z
    .string()
    .regex(/^[A-Za-z0-9_.-]{1,100}$/)
    .refine((value) => value !== '.' && value !== '..'),
});

const PrivateRepositorySchema = z.object({
  full_name: z.string(),
  private: z.literal(true),
  has_issues: z.literal(true),
  archived: z.literal(false),
});

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
 * Create an issue only after verifying the configured repository is private.
 * Unstructured report text must never be sent to a public fallback destination.
 * @param params Issue details (title, body, labels)
 * @returns The created issue or null if failed
 */
export async function createGitHubIssue(
  params: CreateIssueParams,
): Promise<GitHubIssue | null> {
  const env = getRuntimeEnv();
  const target = GitHubTargetSchema.safeParse({
    token: env.GH_API_TOKEN,
    owner: env.GH_OWNER,
    repo: env.GH_REPO,
  });
  if (!target.success) {
    logger.warn('[GitHub] Missing or invalid issue destination configuration.');
    return null;
  }

  try {
    const { token, owner, repo } = target.data;
    const repository = `${owner}/${repo}`;
    const endpoint = `https://api.github.com/repos/${repository}`;
    // Share one deadline across verification, delivery and response reads.
    const signal = AbortSignal.timeout(15_000);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'TestingWithEkki',
    };
    // Check every delivery: a cached private result could outlive a visibility
    // change. Do not follow repository redirects or cache an authorization result.
    const metadata = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal,
      redirect: 'manual',
    });
    if (!metadata.ok) {
      await metadata.body?.cancel();
      logger.error('[GitHub] Cannot verify private issue destination.');
      return null;
    }
    const destination = PrivateRepositorySchema.safeParse(
      await metadata.json(),
    );
    if (
      !destination.success ||
      destination.data.full_name.toLowerCase() !== repository.toLowerCase()
    ) {
      logger.error('[GitHub] Refusing unverified or public issue destination.');
      return null;
    }
    const response = await fetch(`${endpoint}/issues`, {
      method: 'POST',
      signal,
      redirect: 'manual',
      headers,
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        labels: params.labels || ['bug'],
      }),
    });

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
  reportId: string;
}): string {
  return `### Description
${data.actualBehavior}

### Steps to Reproduce
${data.stepsToReproduce}

### Expected Behavior
${data.expectedBehavior}

### Context
- **Page**: ${sanitizeBugReportPageUrl(data.pageUrl) || 'N/A'}
- **Report ID**: ${data.reportId}
`;
}
