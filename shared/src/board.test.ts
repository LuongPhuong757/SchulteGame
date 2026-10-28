import { describe, expect, it } from 'vitest';
import { generateBoard } from './board';
import { GAME_DEFAULTS, type BoardSize } from './config';

describe('generateBoard (BOARD-01)', () => {
  it("matches the golden vector for ('abc', 4)", () => {
    expect(generateBoard('abc', 4)).toEqual([4, 5, 14, 8, 7, 2, 3, 13, 11, 15, 6, 16, 12, 1, 10, 9]);
  });

  it("matches the golden vector for ('abc', 5)", () => {
    expect(generateBoard('abc', 5)).toEqual([
      17, 6, 19, 4, 9, 11, 22, 21, 2, 14, 3, 23, 15, 8, 5, 7, 25, 12, 18, 10, 24, 20, 1, 16, 13,
    ]);
  });

  it("matches the golden vector for ('abc', 6)", () => {
    expect(generateBoard('abc', 6)).toEqual([
      7, 4, 2, 33, 25, 36, 32, 13, 29, 23, 10, 27, 22, 20, 12, 6, 8, 17, 31, 3, 16, 5, 34, 26, 14,
      9, 11, 21, 18, 28, 15, 35, 30, 1, 24, 19,
    ]);
  });

  it('is a permutation of 1..N for every size and 200 seeds', () => {
    for (const size of GAME_DEFAULTS.boardSizes) {
      const expected = Array.from({ length: size * size }, (_, i) => i + 1);
      for (let s = 0; s < 200; s++) {
        expect([...generateBoard(`s${s}`, size)].sort((a, b) => a - b)).toEqual(expected);
      }
    }
  });

  it('is deterministic per seed and differs across seeds', () => {
    expect(generateBoard('abc', 5)).toEqual(generateBoard('abc', 5));
    expect(generateBoard('abc', 5)).not.toEqual(generateBoard('abd', 5));
  });

  it('throws RangeError outside {4, 5, 6}', () => {
    expect(() => generateBoard('abc', 3 as BoardSize)).toThrow(RangeError);
    expect(() => generateBoard('abc', 7 as BoardSize)).toThrow(RangeError);
  });
});
