import { describe, expect, it } from 'bun:test';
import { createExpect } from '@/core/executor/expect-matchers';
import {
  createRuntimeExecutionTrace,
  createTracedPlaywrightPage,
} from '@/core/executor/runtime-trace';
import { MockedPlaywrightPage } from '@/core/executor/playwright-shim';

describe('runtime execution trace', () => {
  it('records learner page and locator calls without shim-internal calls', async () => {
    document.body.innerHTML = '<button>Save</button>';
    const trace = createRuntimeExecutionTrace();
    const rawPage = new MockedPlaywrightPage(document, { timeout: 20 });
    const page = createTracedPlaywrightPage(rawPage, trace);

    await page.getByRole('button', { name: 'Save' }).click();

    expect(trace.methodCalls.map((call) => call.method)).toEqual([
      'getByRole',
      'click',
    ]);
    expect(trace.methodCalls.every((call) => call.succeeded)).toBe(true);
  });

  it('does not trace locator methods used internally by expect matchers', async () => {
    document.body.innerHTML = '<p>Ready</p>';
    const trace = createRuntimeExecutionTrace();
    const rawPage = new MockedPlaywrightPage(document, { timeout: 20 });
    const page = createTracedPlaywrightPage(rawPage, trace);
    const { expect: tracedExpect } = createExpect({
      timeout: 20,
      onAssertion: (assertion) => trace.assertions.push(assertion),
    });

    await tracedExpect(page.getByText('Ready')).toHaveText('Ready');

    expect(trace.methodCalls.map((call) => call.method)).toEqual(['getByText']);
    expect(trace.assertions[0]?.passed).toBe(true);
  });

  it('records bound and bracket evaluate calls and failed actions', async () => {
    document.body.innerHTML = '<button>Save</button>';
    const trace = createRuntimeExecutionTrace();
    const rawPage = new MockedPlaywrightPage(document, { timeout: 5 });
    const page = createTracedPlaywrightPage(rawPage, trace);

    const evaluate = page['evaluate'];
    await evaluate(() => true);

    try {
      await page.getByRole('button', { name: 'Missing' }).click();
    } catch {
      // The trace must retain this failure even when learner code suppresses it.
    }

    expect(trace.methodCalls.map((call) => call.method)).toEqual([
      'evaluate',
      'getByRole',
      'click',
    ]);
    expect(trace.methodCalls.at(-1)?.succeeded).toBe(false);
  });

  it('records failed assertion matchers when learner code catches them', async () => {
    const trace = createRuntimeExecutionTrace();
    const { expect: tracedExpect } = createExpect({
      timeout: 5,
      onAssertion: (assertion) => trace.assertions.push(assertion),
    });

    try {
      await tracedExpect('actual').toBe('expected');
    } catch {
      // The pure validator consumes the failed assertion event.
    }

    expect(trace.assertions).toHaveLength(1);
    expect(trace.assertions[0]?.matcher).toBe('toBe');
    expect(trace.assertions[0]?.passed).toBe(false);
  });
});
