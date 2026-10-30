import { describe, expect, it } from 'bun:test';
import { createServerErrorEvent } from '../../server/sentry.mw';

describe('Workers error diagnostics', () => {
  it('emits a unique correlation ID without request or profile fields', () => {
    const first = createServerErrorEvent();
    const second = createServerErrorEvent();
    expect(first.event).toBe('server_function_failed');
    expect(first.requestId).not.toBe(second.requestId);
    expect(Object.keys(first).sort()).toEqual(['event', 'requestId']);
  });
});
