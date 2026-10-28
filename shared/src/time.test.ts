import { describe, expect, it } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  it.each([
    [0, '0,00'],
    [9, '0,00'],
    [12345, '12,34'],
    [59999, '59,99'],
    [60000, '1:00,00'],
    [65432, '1:05,43'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatTime(ms)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('throws RangeError for %s', (bad) => {
    expect(() => formatTime(bad)).toThrow(RangeError);
  });
});
