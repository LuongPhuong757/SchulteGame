import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GAME_DEFAULTS, formatTime } from '@schulte/shared';
import { vi } from '../i18n/vi';
import { ResultScreen } from './ResultScreen';
import type { GameResult } from './GameScreen';

afterEach(cleanup);

function result(overrides: Partial<GameResult>): GameResult {
  return {
    seed: 'abc',
    size: 4,
    startedAt: 1000,
    rawMs: 10000,
    wrongCount: 0,
    penaltyMs: 0,
    finalMs: 10000,
    taps: [],
    ...overrides,
  };
}

function renderResult(r: GameResult) {
  return render(
    <ResultScreen result={r} nickname="Lan Anh" onReplay={() => undefined} onChangeSize={() => undefined} />,
  );
}

describe('ResultScreen breakdown', () => {
  it('omits the penalty part when there were no wrong taps', () => {
    const { container } = renderResult(result({}));
    expect(container.querySelector('.result-breakdown')?.textContent).toBe(
      vi.result.breakdown(formatTime(10000), 0, GAME_DEFAULTS.wrongTapPenaltyMs / 1000),
    );
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('shows the penalty part with the wrong tap count when there were wrong taps', () => {
    const penaltyMs = 3 * GAME_DEFAULTS.wrongTapPenaltyMs;
    renderResult(result({ wrongCount: 3, penaltyMs, finalMs: 10000 + penaltyMs }));
    const text = screen.getByText(/×/).textContent ?? '';
    expect(text).toContain('3');
    expect(text).toContain(formatTime(10000));
  });
});
