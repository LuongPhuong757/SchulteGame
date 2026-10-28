import { describe, expect, it } from 'vitest';
import { generateBoard } from './board';
import { GAME_DEFAULTS } from './config';
import {
  createGame,
  finalTimeMs,
  gameReducer,
  rawTimeMs,
  replay,
  type GameEvent,
  type GameState,
} from './game';

function run(state: GameState, events: GameEvent[]): GameState {
  return events.reduce(gameReducer, state);
}
const started = (): GameState => gameReducer(createGame('abc', 4), { type: 'start', t: 1000 });
const tapAll = (state: GameState, from: number, to: number, t0: number): GameState => {
  let s = state;
  for (let v = from; v <= to; v++) s = gameReducer(s, { type: 'tap', value: v, t: t0 + (v - from) * 100 });
  return s;
};
function deepFreeze<T>(o: T): T {
  if (typeof o === 'object' && o !== null) {
    Object.freeze(o);
    Object.values(o).forEach(deepFreeze);
  }
  return o;
}

describe('createGame', () => {
  it('starts ready with the seeded board', () => {
    const g = createGame('abc', 4);
    expect(g.status).toBe('ready');
    expect(g.next).toBe(1);
    expect(g.total).toBe(16);
    expect(g.board).toEqual(generateBoard('abc', 4));
  });
});

describe('start (D-02)', () => {
  it('ignores taps while ready', () => {
    const g = createGame('abc', 4);
    expect(gameReducer(g, { type: 'tap', value: 1, t: 5 })).toBe(g);
  });
  it('starts the clock at the start event; a second start is a no-op', () => {
    const s = started();
    expect(s.status).toBe('playing');
    expect(s.startedAt).toBe(1000);
    expect(gameReducer(s, { type: 'start', t: 2000 })).toBe(s);
  });
  it('ignores a start with non-finite t', () => {
    const g = createGame('abc', 4);
    expect(gameReducer(g, { type: 'start', t: NaN })).toBe(g);
  });
});

describe('finishing (BOARD-02)', () => {
  it('finishes after 1..16 with final time = raw time', () => {
    const f = tapAll(started(), 1, 16, 1100);
    expect(f.status).toBe('finished');
    expect(f.finishedAt).toBe(2600);
    expect(finalTimeMs(f)).toBe(1600);
    expect(rawTimeMs(f)).toBe(1600);
    expect(f.taps).toHaveLength(16);
  });
  it('ignores any tap after finished', () => {
    const f = tapAll(started(), 1, 16, 1100);
    expect(gameReducer(f, { type: 'tap', value: 1, t: 9999 })).toBe(f);
    expect(gameReducer(f, { type: 'tap', value: 16, t: 9999 })).toBe(f);
  });
  it('throws on a non-finished state and honours a custom penalty', () => {
    expect(() => finalTimeMs(started())).toThrow();
    expect(() => rawTimeMs(started())).toThrow();
    const f = tapAll(run(started(), [{ type: 'tap', value: 5, t: 1050 }]), 1, 16, 1100);
    expect(finalTimeMs(f, 500)).toBe(1600 + 500);
  });
});

describe('wrong taps (BOARD-03, D-05)', () => {
  it('counts a wrong tap, keeps next, logs it', () => {
    const s = gameReducer(started(), { type: 'tap', value: 5, t: 1050 });
    expect(s.wrongCount).toBe(1);
    expect(s.next).toBe(1);
    expect(s.taps).toHaveLength(1);
  });
  it('adds the penalty to the final time', () => {
    const s = gameReducer(started(), { type: 'tap', value: 5, t: 1050 });
    const f = tapAll(s, 1, 16, 1100);
    expect(finalTimeMs(f)).toBe(rawTimeMs(f) + 1 * GAME_DEFAULTS.wrongTapPenaltyMs);
  });
  it('adds exactly k x penalty for repeated wrong taps on the same cell', () => {
    const wrong = run(started(), [
      { type: 'tap', value: 5, t: 1010 },
      { type: 'tap', value: 5, t: 1020 },
      { type: 'tap', value: 5, t: 1030 },
    ]);
    expect(wrong.wrongCount).toBe(3);
    const f = tapAll(wrong, 1, 16, 1100);
    expect(finalTimeMs(f)).toBe(rawTimeMs(f) + 3 * GAME_DEFAULTS.wrongTapPenaltyMs);
  });
});

describe('found numbers (D-01)', () => {
  it('D-01: tapping an already-found number returns the identical state', () => {
    const s = tapAll(started(), 1, 2, 1100);
    const again = gameReducer(s, { type: 'tap', value: 1, t: 1500 });
    expect(again).toBe(s);
    expect(again.wrongCount).toBe(0);
    expect(again.taps).toHaveLength(2);
  });
});

describe('guards (T-02-04)', () => {
  it('rejects out-of-range or non-integer values', () => {
    const s = started();
    for (const value of [0, 17, 1.5, NaN, -1]) {
      expect(gameReducer(s, { type: 'tap', value, t: 1100 })).toBe(s);
    }
  });
  it('rejects non-finite t and t earlier than the latest recorded time', () => {
    const s = started();
    expect(gameReducer(s, { type: 'tap', value: 1, t: Infinity })).toBe(s);
    expect(gameReducer(s, { type: 'tap', value: 1, t: 999 })).toBe(s);
    const s2 = gameReducer(s, { type: 'tap', value: 1, t: 1100 });
    expect(gameReducer(s2, { type: 'tap', value: 2, t: 1099 })).toBe(s2);
    expect(gameReducer(s2, { type: 'tap', value: 5, t: 1050 })).toBe(s2);
  });
  it('never produces a negative final time', () => {
    const f = tapAll(started(), 1, 16, 1000);
    expect(finalTimeMs(f)).toBeGreaterThanOrEqual(0);
  });
  it('does not mutate a deep-frozen input state', () => {
    const s = deepFreeze(started());
    expect(() => gameReducer(s, { type: 'tap', value: 5, t: 1050 })).not.toThrow();
    expect(() => gameReducer(s, { type: 'tap', value: 1, t: 1100 })).not.toThrow();
  });
});

describe('replay (CR-01)', () => {
  it('reproduces the live reducer result from (seed, size, startT, taps)', () => {
    const live = tapAll(started(), 1, 16, 1100);
    const replayed = replay('abc', 4, 1000, live.taps);
    expect(replayed.status).toBe('finished');
    expect(rawTimeMs(replayed)).toBe(rawTimeMs(live));
    expect(finalTimeMs(replayed)).toBe(finalTimeMs(live));
    expect(replayed.taps).toEqual(live.taps);
  });
  it('counts wrong taps the same way as the live game', () => {
    let live = started();
    live = gameReducer(live, { type: 'tap', value: 9, t: 1050 });
    live = tapAll(live, 1, 16, 1100);
    const replayed = replay('abc', 4, 1000, live.taps);
    expect(replayed.wrongCount).toBe(1);
    expect(finalTimeMs(replayed)).toBe(finalTimeMs(live));
  });
});
