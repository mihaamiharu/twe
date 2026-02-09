import { logger } from '@/lib/logger';

interface CreateIssueParams {
    title: string;
    body: string;
    labels?: string[];
}

interface GitHubIssue {
    id: number;
    number: number;
    html_url: string;
    title: string;
    state: string;
}

/**
 * Create a GitHub issue using the GitHub REST API
 * @param params Issue details (title, body, labels)
 * @returns The created issue or null if failed
 */
export async function createGitHubIssue(
    params: CreateIssueParams,
): Promise<GitHubIssue | null> {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
        logger.warn(
            '[GitHub] Missing configuration. GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are required.',
        );
        return null;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: params.title,
                    body: params.body,
                    labels: params.labels || ['bug'],
                }),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(
                `[GitHub] Failed to create issue. Status: ${response.status}. Response: ${errorText}`,
            );
            return null;
        }

        const issue = (await response.json()) as GitHubIssue;
        logger.info(`[GitHub] Issue created successfully: ${issue.html_url}`);
        return issue;
    } catch (error) {
        logger.error('[GitHub] Error creating issue:', error);
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
