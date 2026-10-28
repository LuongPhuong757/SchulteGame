import { useEffect, useState } from 'react';
import { GAME_DEFAULTS, formatTime } from '@schulte/shared';
import { vi } from '../i18n/vi';

export interface TimerProps {
  startedAt: number | null;
  finishedAt: number | null;
  penaltyMs: number;
}

/**
 * Live timer. The value is recomputed from timestamps on every render, never
 * accumulated from tick counts; the interval only forces a re-render.
 */
export function Timer({ startedAt, finishedAt, penaltyMs }: TimerProps) {
  const [, setTick] = useState(0);
  const running = startedAt !== null && finishedAt === null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), GAME_DEFAULTS.ui.timerTickMs);
    return () => clearInterval(id);
  }, [running]);

  const elapsedMs =
    startedAt === null ? 0 : Math.max(0, (finishedAt ?? performance.now()) - startedAt) + penaltyMs;

  return (
    <div>
      <span>{vi.game.timeLabel}</span>{' '}
      <span role="timer" className="timer">
        {formatTime(elapsedMs)}
      </span>
    </div>
  );
}
