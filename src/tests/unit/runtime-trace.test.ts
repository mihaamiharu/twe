import { describe, expect, it } from 'bun:test';
import { createExpect } from '@/core/executor/expect-matchers';
import {
  createRuntimeExecutionTrace,
  createTracedPlaywrightPage,
  recordRuntimeAssertion,
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
    expect(trace.methodCalls.at(-1)?.locator).toEqual({
      method: 'getByRole',
      value: 'button',
      name: 'Save',
    });
    expect(trace.methodCalls.every((call) => call.succeeded)).toBe(true);
  });

  it('does not trace locator methods used internally by expect matchers', async () => {
    document.body.innerHTML = '<p>Ready</p>';
    const trace = createRuntimeExecutionTrace();
    const rawPage = new MockedPlaywrightPage(document, { timeout: 20 });
    const page = createTracedPlaywrightPage(rawPage, trace);
    const { expect: tracedExpect } = createExpect({
      timeout: 20,
      onAssertion: (assertion) => recordRuntimeAssertion(trace, assertion),
    });

    await tracedExpect(
      page.getByText('Ready', { exact: true }),
    ).toHaveText('Ready');

    expect(trace.methodCalls.map((call) => call.method)).toEqual(['getByText']);
    expect(trace.assertions[0]?.passed).toBe(true);
    expect(trace.assertions[0]?.locator).toEqual({
      method: 'getByText',
      value: 'Ready',
      exact: true,
    });
    expect(trace.events?.map((event) => event.type)).toEqual([
      'method',
      'assertion',
    ]);
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

  it('wraps locators returned in arrays and unwraps drag targets', async () => {
    document.body.innerHTML = '<button>Source</button><button>Target</button>';
    const trace = createRuntimeExecutionTrace();
    const rawPage = new MockedPlaywrightPage(document, { timeout: 20 });
    const page = createTracedPlaywrightPage(rawPage, trace);

    const buttons = await page.getByRole('button').all();
    const source = page.getByRole('button', { name: 'Source' });
    const target = buttons[1];
    if (!target) throw new Error('Expected a target locator');
    await target.click();
    await source.dragTo(target);

    expect(trace.methodCalls.map((call) => call.method)).toEqual([
      'getByRole',
      'all',
      'getByRole',
      'click',
      'dragTo',
    ]);
    expect(trace.methodCalls.some((call) => call.method === 'evaluate')).toBe(false);
    expect(trace.methodCalls.at(-1)?.succeeded).toBe(true);
  });
});
