import { generateBoard } from './board';
import { GAME_DEFAULTS, type BoardSize } from './config';

export type TapEvent = { readonly value: number; readonly t: number };
export type GameEvent =
  | { type: 'start'; t: number }
  | { type: 'tap'; value: number; t: number };
export type GameStatus = 'ready' | 'playing' | 'finished';

export interface GameState {
  readonly status: GameStatus;
  readonly seed: string;
  readonly size: BoardSize;
  readonly total: number;
  readonly board: readonly number[];
  readonly next: number;
  readonly wrongCount: number;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
  readonly taps: readonly TapEvent[];
}

export function createGame(seed: string, size: BoardSize): GameState {
  return {
    status: 'ready',
    seed,
    size,
    total: size * size,
    board: generateBoard(seed, size),
    next: 1,
    wrongCount: 0,
    startedAt: null,
    finishedAt: null,
    taps: [],
  };
}

/** Pure reducer: no clock, no randomness; time enters only through event.t. */
export function gameReducer(state: GameState, event: GameEvent): GameState {
  if (event.type === 'start') {
    if (state.status !== 'ready' || !Number.isFinite(event.t)) return state;
    return { ...state, status: 'playing', startedAt: event.t };
  }

  if (state.status !== 'playing') return state;
  const { value, t } = event;
  if (!Number.isFinite(t)) return state;
  const lastT = state.taps.length > 0 ? state.taps[state.taps.length - 1]!.t : state.startedAt;
  if (lastT !== null && t < lastT) return state;
  if (!Number.isInteger(value) || value < 1 || value > state.total) return state;

  if (value < state.next) return state; // D-01: found number is inert, no penalty, no log

  const taps = [...state.taps, { value, t }];
  if (value === state.next) {
    const finished = value === state.total;
    return {
      ...state,
      status: finished ? 'finished' : 'playing',
      next: state.next + 1,
      taps,
      finishedAt: finished ? t : null,
    };
  }
  // BOARD-03: wrong tap; penalty arithmetic lives only in finalTimeMs.
  return { ...state, wrongCount: state.wrongCount + 1, taps };
}

export function rawTimeMs(state: GameState): number {
  if (state.status !== 'finished' || state.startedAt === null || state.finishedAt === null) {
    throw new Error('Game is not finished');
  }
  return state.finishedAt - state.startedAt;
}

export function finalTimeMs(
  state: GameState,
  penaltyMs: number = GAME_DEFAULTS.wrongTapPenaltyMs,
): number {
  return rawTimeMs(state) + state.wrongCount * penaltyMs;
}

/**
 * Lenient replay of a recorded run: start at `startT`, then apply `taps` in order
 * through the same reducer the UI uses. Invalid events are ignored (see
 * `replayStrict` for the untrusted-input variant).
 */
export function replay(
  seed: string,
  size: BoardSize,
  startT: number,
  taps: readonly TapEvent[],
): GameState {
  let state = gameReducer(createGame(seed, size), { type: 'start', t: startT });
  for (const tap of taps) state = gameReducer(state, { type: 'tap', value: tap.value, t: tap.t });
  return state;
}
