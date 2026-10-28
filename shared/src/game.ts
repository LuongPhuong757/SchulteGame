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

  // Tracer slice: only the correct-tap path. Task 2 adds wrong taps and guards.
  if (state.status === 'playing' && event.value === state.next) {
    const finished = event.value === state.total;
    return {
      ...state,
      status: finished ? 'finished' : 'playing',
      next: state.next + 1,
      taps: [...state.taps, { value: event.value, t: event.t }],
      finishedAt: finished ? event.t : null,
    };
  }
  return state;
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
