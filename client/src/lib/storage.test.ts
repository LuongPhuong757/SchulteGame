import { afterEach, describe, expect, it, vi } from 'vitest';
import { NICKNAME_STORAGE_KEY, loadNickname, saveNickname } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('nickname storage', () => {
  it('uses the schulte:nickname key', () => {
    expect(NICKNAME_STORAGE_KEY).toBe('schulte:nickname');
  });

  it('returns null when nothing is stored', () => {
    expect(loadNickname()).toBeNull();
  });

  it('saves the normalized value and loads it back', () => {
    expect(saveNickname('  Lan   Anh ')).toBe(true);
    expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBe('Lan Anh');
    expect(loadNickname()).toBe('Lan Anh');
  });

  it('rejects an invalid nickname without touching storage', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    expect(saveNickname('<script>')).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBeNull();
  });

  it.each([['<b>x'], ['x'.repeat(40)], ['a‮b']])(
    'drops a tampered stored value %j and removes the key',
    (tampered) => {
      localStorage.setItem(NICKNAME_STORAGE_KEY, tampered);
      expect(loadNickname()).toBeNull();
      expect(localStorage.getItem(NICKNAME_STORAGE_KEY)).toBeNull();
    },
  );

  it('loads a stored NFD value as its NFC form', () => {
    localStorage.setItem(NICKNAME_STORAGE_KEY, 'Nguyễn'.normalize('NFD'));
    expect(loadNickname()).toBe('Nguyễn'.normalize('NFC'));
  });

  it('returns null without throwing when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => loadNickname()).not.toThrow();
    expect(loadNickname()).toBeNull();
  });

  it('returns false without throwing when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => saveNickname('Lan')).not.toThrow();
    expect(saveNickname('Lan')).toBe(false);
  });

  it('survives removeItem throwing while dropping an invalid value', () => {
    localStorage.setItem(NICKNAME_STORAGE_KEY, '<b>x');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(loadNickname()).toBeNull();
  });
});
