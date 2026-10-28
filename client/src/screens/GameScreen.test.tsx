import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { GAME_DEFAULTS, finalTimeMs, formatTime, replay } from '@schulte/shared';
import { vibrate } from '../lib/haptics';
import { vi } from '../i18n/vi';
import { GameScreen } from './GameScreen';
import type { GameResult } from './GameScreen';

// A real primary mouse/touch press (jsdom's default PointerEvent has isPrimary=false).
const PRIMARY_POINTER = { button: 0, isPrimary: true } as const;

function setVibrate(value: unknown): void {
  Object.defineProperty(navigator, 'vibrate', { value, configurable: true });
}

afterEach(() => {
  cleanup();
  vitest.useRealTimers();
  vitest.restoreAllMocks();
  // jsdom has no navigator.vibrate by default (the iOS-like path).
  Reflect.deleteProperty(navigator, 'vibrate');
});

function mockClock(initial: number) {
  const clock = { now: initial };
  vitest.spyOn(performance, 'now').mockImplementation(() => clock.now);
  return clock;
}

function tap(value: number): void {
  fireEvent.pointerDown(screen.getByRole('button', { name: String(value) }), PRIMARY_POINTER);
}

describe('GameScreen wrong-tap feedback (BOARD-03)', () => {
  it('flashes the cell red, vibrates and shows the wrong count', () => {
    const vibrateMock = vitest.fn();
    setVibrate(vibrateMock);
    mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);

    tap(7); // next is 1, so 7 is wrong
    const cell = screen.getByRole('button', { name: '7' });
    expect(cell.className).toContain('cell--wrong');
    expect(vibrateMock).toHaveBeenCalledWith(GAME_DEFAULTS.ui.wrongVibrateMs);
    expect(screen.getByText(vi.game.wrongTaps(1, GAME_DEFAULTS.wrongTapPenaltyMs / 1000))).toBeTruthy();
  });

  it('does not throw and still flashes when navigator.vibrate is absent (iOS)', () => {
    expect(typeof navigator.vibrate).toBe('undefined');
    mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);

    expect(() => tap(7)).not.toThrow();
    expect(screen.getByRole('button', { name: '7' }).className).toContain('cell--wrong');
  });

  it('clears the flash after wrongFlashMs', () => {
    vitest.useFakeTimers();
    mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);

    tap(7);
    expect(screen.getByRole('button', { name: '7' }).className).toContain('cell--wrong');
    act(() => {
      vitest.advanceTimersByTime(GAME_DEFAULTS.ui.wrongFlashMs);
    });
    expect(screen.getByRole('button', { name: '7' }).className).not.toContain('cell--wrong');
  });
});

describe('GameScreen finish (D-02, D-05)', () => {
  it('calls onFinish once with penalty-inclusive time', () => {
    const onFinish = vitest.fn<(r: GameResult) => void>();
    const clock = mockClock(1000); // mount (start) at t=1000
    render(<GameScreen seed="abc" size={4} onFinish={onFinish} />);

    clock.now = 1100;
    tap(7); // wrong
    for (let n = 1; n <= 16; n++) {
      clock.now = n === 16 ? 6000 : 1200 + n;
      tap(n);
    }

    expect(onFinish).toHaveBeenCalledTimes(1);
    const result = onFinish.mock.calls[0]?.[0];
    expect(result?.wrongCount).toBe(1);
    expect(result?.penaltyMs).toBe(GAME_DEFAULTS.wrongTapPenaltyMs);
    expect(result?.rawMs).toBe(5000);
    expect(result?.finalMs).toBe(5000 + GAME_DEFAULTS.wrongTapPenaltyMs);
    expect(result?.seed).toBe('abc');
    expect(result?.size).toBe(4);
    expect(result?.taps).toHaveLength(17);
    expect(result?.startedAt).toBe(1000);
  });

  it('result is self-contained: replaying (seed, size, startedAt, taps) reproduces the final time', () => {
    const onFinish = vitest.fn<(r: GameResult) => void>();
    const clock = mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={onFinish} />);

    clock.now = 1100;
    tap(7); // wrong
    for (let n = 1; n <= 16; n++) {
      clock.now = n === 16 ? 6000 : 1200 + n;
      tap(n);
    }

    const result = onFinish.mock.calls[0]?.[0];
    if (result === undefined) throw new Error('onFinish not called');
    const replayed = replay(result.seed, result.size, result.startedAt, result.taps);
    expect(replayed.status).toBe('finished');
    expect(finalTimeMs(replayed)).toBe(result.finalMs);
  });
});

describe('GameScreen next hint and live timer (BOARD-02)', () => {
  it('shows the next number hint and advances it after a correct tap', () => {
    mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);
    expect(screen.getByText(vi.game.next(1))).toBeTruthy();
    tap(1);
    expect(screen.getByText(vi.game.next(2))).toBeTruthy();
  });

  it('live timer already includes the +2 s penalty per wrong tap', () => {
    vitest.useFakeTimers();
    const clock = mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);

    clock.now = 1100;
    tap(7); // one wrong tap
    clock.now = 2500; // 1500 ms since mount
    act(() => {
      vitest.advanceTimersByTime(GAME_DEFAULTS.ui.timerTickMs);
    });
    expect(screen.getByRole('timer').textContent).toBe(
      formatTime(1500 + GAME_DEFAULTS.wrongTapPenaltyMs),
    );
  });

  it('timer stops after the final tap and equals the result final time', () => {
    vitest.useFakeTimers();
    const onFinish = vitest.fn<(r: GameResult) => void>();
    const clock = mockClock(1000);
    render(<GameScreen seed="abc" size={4} onFinish={onFinish} />);

    clock.now = 1100;
    tap(7); // wrong
    for (let n = 1; n <= 16; n++) {
      clock.now = n === 16 ? 6000 : 1200 + n;
      tap(n);
    }
    const finalMs = onFinish.mock.calls[0]?.[0].finalMs ?? -1;
    const shown = screen.getByRole('timer').textContent;
    expect(shown).toBe(formatTime(finalMs));

    clock.now = 99000;
    act(() => {
      vitest.advanceTimersByTime(GAME_DEFAULTS.ui.timerTickMs * 5);
    });
    expect(screen.getByRole('timer').textContent).toBe(shown);
    expect(screen.queryByText(vi.game.next(16))).toBeNull();
  });
});

describe('vibrate()', () => {
  it('returns false when navigator.vibrate is missing', () => {
    expect(vibrate(100)).toBe(false);
  });

  it('returns false and does not throw when navigator.vibrate throws', () => {
    setVibrate(() => {
      throw new Error('not allowed');
    });
    expect(() => vibrate(100)).not.toThrow();
    expect(vibrate(100)).toBe(false);
  });

  it('returns true and calls navigator.vibrate when present', () => {
    const vibrateMock = vitest.fn();
    setVibrate(vibrateMock);
    expect(vibrate(150)).toBe(true);
    expect(vibrateMock).toHaveBeenCalledWith(150);
  });
});
