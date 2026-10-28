import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { BLOCKED_FOLDED_TOKENS } from '../../../shared/src/nickname-blocklist';
import { App } from '../App';
import { vi } from '../i18n/vi';
import { NICKNAME_STORAGE_KEY } from '../lib/storage';
import { MenuScreen } from './MenuScreen';

vitest.mock('../lib/seed', () => ({ newSeed: () => 'abc' }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vitest.restoreAllMocks();
});

function nicknameInput(): HTMLInputElement {
  return screen.getByLabelText(vi.menu.nicknameLabel) as HTMLInputElement;
}

function submit(): void {
  const form = nicknameInput().closest('form');
  if (form === null) throw new Error('no form');
  fireEvent.submit(form);
}

function renderMenu(onStart = vitest.fn()) {
  render(<MenuScreen initialNickname="" initialSize={4} onStart={onStart} />);
  return onStart;
}

describe('MenuScreen prefill (ID-02)', () => {
  it('prefills the stored nickname in App', () => {
    localStorage.setItem(NICKNAME_STORAGE_KEY, 'Lan Anh');
    render(<App />);
    expect(nicknameInput().value).toBe('Lan Anh');
  });

  it('is empty with nothing stored', () => {
    render(<App />);
    expect(nicknameInput().value).toBe('');
  });

  it('is empty when the stored value is invalid', () => {
    localStorage.setItem(NICKNAME_STORAGE_KEY, 'x');
    render(<App />);
    expect(nicknameInput().value).toBe('');
  });
});

describe('MenuScreen validation (ID-01)', () => {
  it('too short: shows the Vietnamese alert, does not start, storage unchanged', () => {
    const onStart = renderMenu();
    fireEvent.change(nicknameInput(), { target: { value: 'A' } });
    submit();
    expect(screen.getByRole('alert').textContent).toBe(vi.nicknameErrors.too_short);
    expect(onStart).not.toHaveBeenCalled();
    expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBeNull();
  });

  it('too long', () => {
    const onStart = renderMenu();
    fireEvent.change(nicknameInput(), { target: { value: 'a'.repeat(17) } });
    submit();
    expect(screen.getByRole('alert').textContent).toBe(vi.nicknameErrors.too_long);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('bad characters', () => {
    const onStart = renderMenu();
    fireEvent.change(nicknameInput(), { target: { value: 'a<b' } });
    submit();
    expect(screen.getByRole('alert').textContent).toBe(vi.nicknameErrors.bad_chars);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('blocked: neutral message that never echoes the typed value', () => {
    const onStart = renderMenu();
    const typed = BLOCKED_FOLDED_TOKENS[0] ?? '';
    expect(typed.length).toBeGreaterThan(1);
    fireEvent.change(nicknameInput(), { target: { value: typed } });
    submit();
    const text = screen.getByRole('alert').textContent ?? '';
    expect(text).toBe(vi.nicknameErrors.blocked);
    expect(text).not.toContain(typed);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('editing the input clears the error', () => {
    renderMenu();
    fireEvent.change(nicknameInput(), { target: { value: 'A' } });
    submit();
    expect(screen.queryByRole('alert')).not.toBeNull();
    fireEvent.change(nicknameInput(), { target: { value: 'An' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('limit messages are interpolated from config, not literals', () => {
    expect(vi.nicknameErrors.too_short).toContain('2');
    expect(vi.nicknameErrors.too_long).toContain('16');
  });
});

describe('MenuScreen size choice (SOLO-01)', () => {
  it('shows three size buttons toggling aria-pressed, default initialSize', () => {
    render(<MenuScreen initialNickname="" initialSize={5} onStart={() => undefined} />);
    const b4 = screen.getByRole('button', { name: vi.menu.sizeOption(4) });
    const b5 = screen.getByRole('button', { name: vi.menu.sizeOption(5) });
    const b6 = screen.getByRole('button', { name: vi.menu.sizeOption(6) });
    expect(b5.getAttribute('aria-pressed')).toBe('true');
    expect(b4.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(b6);
    expect(b6.getAttribute('aria-pressed')).toBe('true');
    expect(b5.getAttribute('aria-pressed')).toBe('false');
  });

  it('submits the normalized nickname and chosen size', () => {
    const onStart = renderMenu();
    fireEvent.change(nicknameInput(), { target: { value: '  Lan   Anh ' } });
    fireEvent.click(screen.getByRole('button', { name: vi.menu.sizeOption(5) }));
    submit();
    expect(onStart).toHaveBeenCalledWith('Lan Anh', 5);
  });
});

describe('App start from the menu', () => {
  it('saves the nickname and shows a 25-cell board', () => {
    render(<App />);
    fireEvent.change(nicknameInput(), { target: { value: '  Lan   Anh ' } });
    fireEvent.click(screen.getByRole('button', { name: vi.menu.sizeOption(5) }));
    submit();
    expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBe('Lan Anh');
    expect(screen.getAllByRole('button')).toHaveLength(25);
  });
});
