import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { App } from './App';
import { vi } from './i18n/vi';

vitest.mock('./lib/seed', () => ({ newSeed: () => 'abc' }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vitest.restoreAllMocks();
});

describe('App tracer flow', () => {
  it('start -> tap 1..16 -> result title and seconds', () => {
    let clock = 1000;
    vitest.spyOn(performance, 'now').mockImplementation(() => (clock += 100));

    render(<App />);
    fireEvent.change(screen.getByLabelText(vi.menu.nicknameLabel), { target: { value: 'Lan Anh' } });
    fireEvent.click(screen.getByRole('button', { name: vi.start }));

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(16);
    expect(buttons[0]?.textContent).toBe('4');

    for (let n = 1; n <= 16; n++) {
      fireEvent.pointerDown(screen.getByRole('button', { name: String(n) }));
    }

    expect(screen.getByText(vi.result.title)).toBeTruthy();
    expect(screen.getByText(/ giây$/)).toBeTruthy();
  });
});
