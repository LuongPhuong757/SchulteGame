import { describe, expect, it } from 'vitest';
import { GAME_DEFAULTS, isBoardSize } from './config';

describe('GAME_DEFAULTS (OPS-08)', () => {
  it('holds the six SPEC §8 defaults', () => {
    expect(GAME_DEFAULTS.wrongTapPenaltyMs).toBe(2000);
    expect(GAME_DEFAULTS.grabLockMs).toBe(2000);
    expect(GAME_DEFAULTS.roomCodeLength).toBe(4);
    expect(GAME_DEFAULTS.roomIdleExpiryMs).toBe(600000);
    expect(GAME_DEFAULTS.reconnectGraceMs).toBe(15000);
    expect(GAME_DEFAULTS.maxPlayersPerRoom).toBe(4);
  });

  it('offers board sizes 4, 5, 6 and the D-03 nickname bounds', () => {
    expect([...GAME_DEFAULTS.boardSizes]).toEqual([4, 5, 6]);
    expect(GAME_DEFAULTS.nickname.minLength).toBe(2);
    expect(GAME_DEFAULTS.nickname.maxLength).toBe(16);
  });

  it('is deep-frozen at runtime', () => {
    expect(Object.isFrozen(GAME_DEFAULTS)).toBe(true);
    expect(Object.isFrozen(GAME_DEFAULTS.nickname)).toBe(true);
    expect(Object.isFrozen(GAME_DEFAULTS.ui)).toBe(true);
    expect(Object.isFrozen(GAME_DEFAULTS.boardSizes)).toBe(true);
  });

  it('isBoardSize accepts only 4, 5, 6', () => {
    expect([4, 5, 6].every(isBoardSize)).toBe(true);
    for (const bad of [3, 7, 0, 4.5, '4', null, undefined, NaN]) {
      expect(isBoardSize(bad)).toBe(false);
    }
  });
});
