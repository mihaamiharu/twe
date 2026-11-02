import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createGitHubIssue, formatBugReportBody } from '@/server/github.server';
import { logger } from '@/lib/logger';
import { sanitizeBugReportPageUrl } from '@/lib/bug-report-privacy';

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  token: process.env.GH_API_TOKEN,
  owner: process.env.GH_OWNER,
  repo: process.env.GH_REPO,
};

const privateRepository = {
  full_name: 'testing-with-ekki/twe',
  private: true,
  has_issues: true,
  archived: false,
};

const validIssue = {
  id: 101,
  number: 17,
  html_url: 'https://github.com/testing-with-ekki/twe/issues/17',
  title: 'Validated bug',
  state: 'open',
  extra_api_field: true,
};

function mockResponses(...responses: Response[]) {
  const calls: Array<{ url: string; options: RequestInit }> = [];
  Reflect.set(
    globalThis,
    'fetch',
    mock((input: RequestInfo | URL, options: RequestInit = {}) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      calls.push({ url, options });
      const response = responses.shift();
      if (!response) throw new Error('Unexpected extra HTTP request');
      return Promise.resolve(response);
    }),
  );
  return calls;
}

describe('private GitHub issue delivery', () => {
  const errors: string[] = [];

  beforeEach(() => {
    process.env.GH_API_TOKEN = 'test-token';
    process.env.GH_OWNER = 'testing-with-ekki';
    process.env.GH_REPO = 'twe';
    errors.length = 0;
    logger.setHandler((level, message) => {
      if (level === 'error') errors.push(message);
    });
  });

  afterEach(() => {
    Reflect.set(globalThis, 'fetch', originalFetch);
    logger.setHandler(null);
    restoreEnvironment('GH_API_TOKEN', originalEnvironment.token);
    restoreEnvironment('GH_OWNER', originalEnvironment.owner);
    restoreEnvironment('GH_REPO', originalEnvironment.repo);
  });

  test('returns a validated issue response', async () => {
    const calls = mockResponses(
      Response.json(privateRepository),
      Response.json(validIssue, { status: 201 }),
    );

    const issue = await createGitHubIssue({
      title: 'Validated bug',
      body: 'Steps',
    });

    expect(issue?.number).toBe(17);
    expect(issue?.html_url).toEndWith('/issues/17');
    expect(calls.map((call) => [call.options.method, call.url])).toEqual([
      ['GET', 'https://api.github.com/repos/testing-with-ekki/twe'],
      ['POST', 'https://api.github.com/repos/testing-with-ekki/twe/issues'],
    ]);
    expect(calls[0]!.options.body).toBeUndefined();
    expect(calls[0]!.options.signal).toBe(calls[1]!.options.signal);
    expect(calls.every((call) => call.options.redirect === 'manual')).toBe(
      true,
    );
  });

  test.each([
    { ...privateRepository, private: false },
    { ...privateRepository, full_name: 'different/repository' },
    { ...privateRepository, has_issues: false },
    { ...privateRepository, archived: true },
    { full_name: 'testing-with-ekki/twe' },
  ])(
    'does not post a report to an unverified destination: %j',
    async (metadata) => {
      const calls = mockResponses(Response.json(metadata));
      expect(
        await createGitHubIssue({
          title: 'Private report',
          body: 'Private details',
        }),
      ).toBeNull();
      expect(calls).toHaveLength(1);
      expect(calls[0]!.options.method).toBe('GET');
    },
  );

  test.each([301, 401, 403, 404, 500])(
    'does not post when metadata returns HTTP %s',
    async (status) => {
      const calls = mockResponses(new Response('not trusted', { status }));
      expect(
        await createGitHubIssue({
          title: 'Private report',
          body: 'Private details',
        }),
      ).toBeNull();
      expect(calls).toHaveLength(1);
    },
  );

  test('rechecks visibility on every delivery', async () => {
    const calls = mockResponses(
      Response.json(privateRepository),
      Response.json(validIssue, { status: 201 }),
      Response.json({ ...privateRepository, private: false }),
    );
    expect(
      await createGitHubIssue({ title: 'First', body: 'Steps' }),
    ).not.toBeNull();
    expect(
      await createGitHubIssue({ title: 'Second', body: 'Steps' }),
    ).toBeNull();
    expect(calls.map((call) => call.options.method)).toEqual([
      'GET',
      'POST',
      'GET',
    ]);
  });

  test('does not follow a configured repository path escape', async () => {
    process.env.GH_REPO = '../other/issues';
    const calls = mockResponses();
    expect(
      await createGitHubIssue({ title: 'Private report', body: 'Steps' }),
    ).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test('fails closed on invalid metadata JSON', async () => {
    const calls = mockResponses(new Response('not-json'));
    expect(
      await createGitHubIssue({ title: 'Private report', body: 'Steps' }),
    ).toBeNull();
    expect(calls).toHaveLength(1);
  });

  test('does nothing when delivery is not configured', async () => {
    delete process.env.GH_API_TOKEN;
    const calls = mockResponses();
    expect(
      await createGitHubIssue({ title: 'Private report', body: 'Steps' }),
    ).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test.each([401, 422, 500])(
    'does not retry a rejected issue submission: HTTP %s',
    async (status) => {
      const calls = mockResponses(
        Response.json(privateRepository),
        new Response('not accepted', { status }),
      );
      expect(
        await createGitHubIssue({ title: 'Private report', body: 'Steps' }),
      ).toBeNull();
      expect(calls.map((call) => call.options.method)).toEqual(['GET', 'POST']);
    },
  );

  test('does not retry an uncertain network failure during delivery', async () => {
    let calls = 0;
    Reflect.set(
      globalThis,
      'fetch',
      mock(() => {
        if (++calls === 1)
          return Promise.resolve(Response.json(privateRepository));
        return Promise.reject(new Error('synthetic network failure'));
      }),
    );
    expect(
      await createGitHubIssue({ title: 'Private report', body: 'Steps' }),
    ).toBeNull();
    expect(calls).toBe(2);
  });

  test('rejects a structurally invalid successful response', async () => {
    mockResponses(
      Response.json(privateRepository),
      Response.json(
        { id: 101, number: 17, html_url: 42, title: 'Bug' },
        { status: 201 },
      ),
    );

    expect(await createGitHubIssue({ title: 'Bug', body: 'Steps' })).toBeNull();
    expect(errors[0]).toBe('[GitHub] Error creating issue.');
  });

  test('rejects invalid JSON with repository context', async () => {
    mockResponses(
      Response.json(privateRepository),
      new Response('not-json', { status: 201 }),
    );

    expect(await createGitHubIssue({ title: 'Bug', body: 'Steps' })).toBeNull();
    expect(errors[0]).toBe('[GitHub] Error creating issue.');
  });
});

describe('bug report export privacy', () => {
  test('drops contact identifiers, raw browser information and URL secrets', () => {
    // Rich historical DB records must not accidentally expand the export.
    const report = {
      reportId: 'synthetic-report-reference',
      stepsToReproduce: 'Open the practice page',
      expectedBehavior: 'The editor should load',
      actualBehavior: 'The editor stays blank',
      pageUrl:
        'https://reporter:private-password@example.test/en/practice?token=private-token#private-fragment',
      reporterEmail: 'private-reporter@example.test',
      userId: 'private-user-id',
      browserInfo: 'private-browser-fingerprint',
    };
    const body = formatBugReportBody(report);
    expect(body).toContain('https://example.test/en/practice');
    expect(body).toContain('synthetic-report-reference');
    expect(body).toContain('The editor stays blank');
    for (const secret of [
      'private-password',
      'private-token',
      'private-fragment',
      report.reporterEmail,
      report.userId,
      report.browserInfo,
    ])
      expect(body).not.toContain(secret);
    expect(body).not.toContain('**Reporter**');
    expect(body).not.toContain('**Browser**');
  });

  test.each([
    'not a URL',
    'javascript:alert(1)',
    'file:///private/example',
    'data:text/plain,private',
    '',
    null,
    undefined,
  ])('omits invalid or non-web page context: %s', (value) => {
    expect(sanitizeBugReportPageUrl(value)).toBeNull();
  });

  test('preserves the web origin and pathname only', () => {
    expect(
      sanitizeBugReportPageUrl(
        'http://localhost:3000/en/practice?token=private#fragment',
      ),
    ).toBe('http://localhost:3000/en/practice');
  });
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
