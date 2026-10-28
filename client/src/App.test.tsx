import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import { formatTime, generateBoard } from '@schulte/shared';
import { App } from './App';
import { vi } from './i18n/vi';
import { newSeed } from './lib/seed';
import { NICKNAME_STORAGE_KEY } from './lib/storage';

// A real primary mouse/touch press (jsdom's default PointerEvent has isPrimary=false).
const PRIMARY_POINTER = { button: 0, isPrimary: true } as const;

vitest.mock('./lib/seed', () => ({ newSeed: vitest.fn() }));

const fetchSpy = vitest.fn();
const clock = { now: 1000 };

beforeEach(() => {
  clock.now = 1000;
  vitest.spyOn(performance, 'now').mockImplementation(() => clock.now);
  vitest.mocked(newSeed).mockReset();
  vitest.mocked(newSeed).mockReturnValueOnce('abc').mockReturnValueOnce('abd');
  fetchSpy.mockReset();
  vitest.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vitest.unstubAllGlobals();
  vitest.restoreAllMocks();
});

function nicknameInput(): HTMLInputElement {
  return screen.getByLabelText(vi.menu.nicknameLabel) as HTMLInputElement;
}

function submitMenu(): void {
  const form = nicknameInput().closest('form');
  if (form === null) throw new Error('no form');
  fireEvent.submit(form);
}

function tap(value: number): void {
  fireEvent.pointerDown(screen.getByRole('button', { name: String(value) }), PRIMARY_POINTER);
}

function boardOrder(): string[] {
  return screen.getAllByRole('button').map((b) => b.textContent ?? '');
}

describe('full solo flow (SOLO-01, ID-02, BOARD-02)', () => {
  it('menu -> play with a wrong tap -> result -> replay -> change size -> reload prefill, no network', () => {
    render(<App />);

    // Menu: nickname + 5x5
    fireEvent.change(nicknameInput(), { target: { value: 'Lan Anh' } });
    fireEvent.click(screen.getByRole('button', { name: vi.menu.sizeOption(5) }));
    submitMenu();

    // Board for seed 'abc', 5x5 (golden: first cell is 17)
    let order = boardOrder();
    expect(order).toHaveLength(25);
    expect(order[0]).toBe('17');
    expect(order).toEqual(generateBoard('abc', 5).map(String));

    // One wrong tap, then 1..25; raw = 11000 - 1000
    clock.now = 1500;
    tap(25);
    for (let n = 1; n <= 25; n++) {
      clock.now = n === 25 ? 11000 : 1600 + n;
      tap(n);
    }

    expect(screen.getByText(vi.result.title)).toBeTruthy();
    expect(screen.getByText(vi.result.greeting('Lan Anh'))).toBeTruthy();
    expect(screen.getByText(vi.result.seconds(formatTime(12000)))).toBeTruthy();
    expect(screen.getByText(vi.result.breakdown(formatTime(10000), 1, 2))).toBeTruthy();

    // Replay: fresh seed 'abd', same size
    clock.now = 20000;
    fireEvent.click(screen.getByRole('button', { name: vi.result.replay }));
    order = boardOrder();
    expect(order).toHaveLength(25);
    expect(order).toEqual(generateBoard('abd', 5).map(String));
    expect(order).not.toEqual(generateBoard('abc', 5).map(String));

    // Finish again cleanly, then change size: menu keeps nickname and size
    for (let n = 1; n <= 25; n++) {
      clock.now = 20000 + n * 100;
      tap(n);
    }
    expect(screen.getByText(vi.result.seconds(formatTime(2500)))).toBeTruthy();
    expect(screen.getByText(vi.result.breakdown(formatTime(2500), 0, 2))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: vi.result.changeSize }));
    expect(nicknameInput().value).toBe('Lan Anh');
    expect(
      screen.getByRole('button', { name: vi.menu.sizeOption(5) }).getAttribute('aria-pressed'),
    ).toBe('true');

    // Reload simulation: a fresh App reads the saved nickname
    expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBe('Lan Anh');
    cleanup();
    render(<App />);
    expect(nicknameInput().value).toBe('Lan Anh');

    // SOLO-01 privacy: nothing left the device
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
