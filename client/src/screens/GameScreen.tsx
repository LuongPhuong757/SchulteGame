import { useEffect, useReducer, useRef, useState } from 'react';
import {
  GAME_DEFAULTS,
  createGame,
  finalTimeMs,
  gameReducer,
  rawTimeMs,
} from '@schulte/shared';
import type { BoardSize, TapEvent } from '@schulte/shared';
import { Board } from '../components/Board';
import { Timer } from '../components/Timer';
import { vi } from '../i18n/vi';
import { vibrate } from '../lib/haptics';

export interface GameResult {
  seed: string;
  size: BoardSize;
  rawMs: number;
  wrongCount: number;
  /** wrongCount * GAME_DEFAULTS.wrongTapPenaltyMs */
  penaltyMs: number;
  /** finalTimeMs(state) */
  finalMs: number;
  /** Kept for Phase 2 submission. */
  taps: readonly TapEvent[];
}

export function GameScreen(props: {
  seed: string;
  size: BoardSize;
  onFinish: (r: GameResult) => void;
}) {
  const { seed, size, onFinish } = props;
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(seed, size));
  const [flash, setFlash] = useState<{ value: number; key: number } | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    // D-02: the clock starts when the board is revealed; no countdown in solo.
    // Harmless under StrictMode double-invocation: start is a no-op unless 'ready'.
    dispatch({ type: 'start', t: performance.now() });
  }, []);

  // Wrong-tap feedback is DERIVED from reducer output (wrongCount increase),
  // never from rules re-implemented here.
  useEffect(() => {
    if (state.wrongCount === 0) return;
    const last = state.taps[state.taps.length - 1];
    if (last === undefined) return;
    setFlash({ value: last.value, key: state.wrongCount });
    vibrate(GAME_DEFAULTS.ui.wrongVibrateMs);
    const timeout = setTimeout(() => setFlash(null), GAME_DEFAULTS.ui.wrongFlashMs);
    return () => clearTimeout(timeout);
    // Only a wrongCount change is a new wrong tap; taps is read at that moment.
  }, [state.wrongCount]);

  useEffect(() => {
    if (state.status !== 'finished' || finishedRef.current) return;
    finishedRef.current = true;
    onFinish({
      seed,
      size,
      rawMs: rawTimeMs(state),
      wrongCount: state.wrongCount,
      penaltyMs: state.wrongCount * GAME_DEFAULTS.wrongTapPenaltyMs,
      finalMs: finalTimeMs(state),
      taps: state.taps,
    });
    // onFinish identity must not retrigger; the ref guards single delivery.
  }, [state.status]);

  return (
    <main>
      <h1>{vi.appTitle}</h1>
      <div className="game-header">
        {state.status !== 'finished' && <span>{vi.game.next(state.next)}</span>}
        <Timer
          startedAt={state.startedAt}
          finishedAt={state.finishedAt}
          penaltyMs={state.wrongCount * GAME_DEFAULTS.wrongTapPenaltyMs}
        />
      </div>
      <Board
        board={state.board}
        size={state.size}
        next={state.next}
        flash={flash}
        disabled={state.status !== 'playing'}
        onTap={(value) => dispatch({ type: 'tap', value, t: performance.now() })}
      />
      {state.wrongCount > 0 && (
        <p className="wrong-count">
          {vi.game.wrongTaps(state.wrongCount, GAME_DEFAULTS.wrongTapPenaltyMs / 1000)}
        </p>
      )}
    </main>
  );
}
