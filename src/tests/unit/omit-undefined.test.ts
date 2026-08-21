import { describe, expect, test } from 'bun:test';
import { omitUndefined } from '@/lib/omit-undefined';

describe('omitUndefined', () => {
  test('omits undefined properties instead of assigning undefined', () => {
    const result = omitUndefined({
      checked: undefined as boolean | undefined,
      label: 'coming-soon',
    });

    expect(result).toEqual({ label: 'coming-soon' });
    expect('checked' in result).toBe(false);
  });

  test('preserves meaningful falsy values and null', () => {
    const result = omitUndefined({
      checked: false as boolean | undefined,
      count: 0 as number | undefined,
      text: '' as string | undefined,
      payload: null as string | null | undefined,
    });

    expect(result).toEqual({
      checked: false,
      count: 0,
      text: '',
      payload: null,
    });
  });
});
