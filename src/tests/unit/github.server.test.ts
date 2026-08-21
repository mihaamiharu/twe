import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createGitHubIssue } from '@/server/github.server';
import { logger } from '@/lib/logger';

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  token: process.env.GH_API_TOKEN,
  owner: process.env.GH_OWNER,
  repo: process.env.GH_REPO,
};

describe('createGitHubIssue response validation', () => {
  const errors: Error[] = [];

  beforeEach(() => {
    process.env.GH_API_TOKEN = 'test-token';
    process.env.GH_OWNER = 'testing-with-ekki';
    process.env.GH_REPO = 'twe';
    errors.length = 0;
    logger.setHandler((level, _message, args) => {
      if (level !== 'error') return;
      for (const argument of args) {
        if (argument instanceof Error) errors.push(argument);
      }
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
    Reflect.set(globalThis, 'fetch', mock(() => Promise.resolve(new Response(
      JSON.stringify({
        id: 101,
        number: 17,
        html_url: 'https://github.com/testing-with-ekki/twe/issues/17',
        title: 'Validated bug',
        state: 'open',
        extra_api_field: true,
      }),
      { status: 201 },
    ))));

    const issue = await createGitHubIssue({
      title: 'Validated bug',
      body: 'Steps',
    });

    expect(issue?.number).toBe(17);
    expect(issue?.html_url).toEndWith('/issues/17');
  });

  test('rejects a structurally invalid successful response', async () => {
    Reflect.set(globalThis, 'fetch', mock(() => Promise.resolve(new Response(
      JSON.stringify({ id: 101, number: 17, html_url: 42, title: 'Bug' }),
      { status: 201 },
    ))));

    expect(await createGitHubIssue({ title: 'Bug', body: 'Steps' })).toBeNull();
    expect(errors[0]?.message).toContain('testing-with-ekki/twe');
    expect(errors[0]?.message).toContain('html_url');
  });

  test('rejects invalid JSON with repository context', async () => {
    Reflect.set(globalThis, 'fetch', mock(() => Promise.resolve(new Response(
      'not-json',
      { status: 201 },
    ))));

    expect(await createGitHubIssue({ title: 'Bug', body: 'Steps' })).toBeNull();
    expect(errors[0]?.message).toBe(
      '[GitHub] Invalid JSON response while creating issue for testing-with-ekki/twe',
    );
  });
});

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
