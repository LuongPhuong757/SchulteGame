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

/** Largest timestamp (ms) a strict replay accepts: far above any real page lifetime. */
export const MAX_REPLAY_T_MS = 1e12;
/** Default cap on a single run's raw duration for strict replay (1 hour). */
export const DEFAULT_MAX_REPLAY_DURATION_MS = 60 * 60 * 1000;

export interface ReplayStrictOptions {
  /** Minimum gap between consecutive events (start included). Default 0. */
  readonly minTapIntervalMs?: number;
  /** Maximum raw duration (finishedAt - startedAt). Default 1 hour. */
  readonly maxDurationMs?: number;
}

export type ReplayStrictResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: string };

/**
 * Strict replay for untrusted logs (Phase 2 server verification). Unlike the
 * lenient reducer it REJECTS rather than ignores: out-of-range or decreasing
 * timestamps, non-integer / out-of-range / already-found values, taps after the
 * game finished, an incomplete log, gaps below `minTapIntervalMs` and runs
 * longer than `maxDurationMs`. Wrong taps (value > next) are legitimate input.
 */
export function replayStrict(
  seed: string,
  size: BoardSize,
  startT: number,
  taps: readonly TapEvent[],
  options: ReplayStrictOptions = {},
): ReplayStrictResult {
  const minInterval = options.minTapIntervalMs ?? 0;
  const maxDuration = options.maxDurationMs ?? DEFAULT_MAX_REPLAY_DURATION_MS;
  const inRange = (t: unknown): t is number =>
    typeof t === 'number' && Number.isFinite(t) && t >= 0 && t <= MAX_REPLAY_T_MS;

  if (!inRange(startT)) return { ok: false, reason: 'invalid_start_time' };
  let state = gameReducer(createGame(seed, size), { type: 'start', t: startT });
  if (state.status !== 'playing') return { ok: false, reason: 'start_rejected' };

  let lastT = startT;
  for (const [i, tap] of taps.entries()) {
    if (state.status === 'finished') return { ok: false, reason: `tap_after_finish:${i}` };
    if (typeof tap !== 'object' || tap === null) return { ok: false, reason: `invalid_tap:${i}` };
    const { value, t } = tap;
    if (!inRange(t)) return { ok: false, reason: `invalid_time:${i}` };
    if (t < lastT) return { ok: false, reason: `time_decreasing:${i}` };
    if (t - lastT < minInterval) return { ok: false, reason: `tap_too_fast:${i}` };
    if (!Number.isInteger(value) || value < 1 || value > state.total) {
      return { ok: false, reason: `invalid_value:${i}` };
    }
    if (value < state.next) return { ok: false, reason: `already_found:${i}` };
    const next = gameReducer(state, { type: 'tap', value, t });
    if (next === state) return { ok: false, reason: `tap_rejected:${i}` };
    state = next;
    lastT = t;
  }

  if (state.status !== 'finished') return { ok: false, reason: 'not_finished' };
  if (rawTimeMs(state) > maxDuration) return { ok: false, reason: 'duration_exceeded' };
  return { ok: true, state };
}
