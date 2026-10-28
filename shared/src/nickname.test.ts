import { describe, expect, it } from 'vitest';
import { GAME_DEFAULTS } from './config';
import { foldNickname, isBlockedNickname, validateNickname } from './nickname';
import {
  BLOCKED_ACCENTED_TOKENS,
  BLOCKED_FOLDED_SUBSTRINGS,
  BLOCKED_FOLDED_TOKENS,
} from './nickname-blocklist';

// Fairness fixtures: real names and everyday words that must never be blocked.
const MUST_ACCEPT = [
  'Long',
  'Đạt',
  'Lan Anh',
  'Lớn',
  'Các Bạn',
  'Buổi Sáng',
  'Phúc',
  'Cúc',
  'Đức',
  'Dương',
  'Hà My',
  'Hồng',
  'Lộc',
  'Cường',
  'Đông',
  'Bích',
  'Scunthorpe',
  'an_88',
  'mr.bean',
  'Tuấn-1990',
];

const LEET: Record<string, string> = { o: '0', i: '1', e: '3', a: '4' };
const leetify = (s: string) => s.replace(/[oiea]/g, (c) => LEET[c] ?? c);
const dotted = (s: string) => [...s].join('.');

describe('validateNickname length and normalization', () => {
  it('returns the NFC value for NFC and NFD input alike', () => {
    const nfc = 'Nguyễn Văn A'.normalize('NFC');
    const nfd = nfc.normalize('NFD');
    expect(nfd).not.toBe(nfc);
    expect(validateNickname(nfc)).toEqual({ ok: true, value: nfc });
    expect(validateNickname(nfd)).toEqual({ ok: true, value: nfc });
  });

  it('collapses whitespace runs and trims', () => {
    expect(validateNickname('  Lan    Anh  ')).toEqual({ ok: true, value: 'Lan Anh' });
    expect(validateNickname('Lan\t Anh')).toEqual({ ok: true, value: 'Lan Anh' });
  });

  it('accepts exactly minLength and maxLength code points', () => {
    expect(validateNickname('Lý').ok).toBe(true);
    const sixteen = 'Nguyễn Thị Hương'; // 16 code points in NFC
    expect([...sixteen.normalize('NFC')].length).toBe(GAME_DEFAULTS.nickname.maxLength);
    expect(sixteen.normalize('NFD').length).toBeGreaterThan(GAME_DEFAULTS.nickname.maxLength);
    expect(validateNickname(sixteen.normalize('NFD')).ok).toBe(true);
    expect(validateNickname('a'.repeat(GAME_DEFAULTS.nickname.maxLength)).ok).toBe(true);
  });

  it.each(['', '   ', 'A', '\t\n'])('rejects %j as too_short', (raw) => {
    expect(validateNickname(raw)).toEqual({ ok: false, reason: 'too_short' });
  });

  it('rejects 17 code points as too_long', () => {
    expect(validateNickname('a'.repeat(GAME_DEFAULTS.nickname.maxLength + 1))).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });

  it('rejects raw input over maxInputLength UTF-16 units as too_long before normalization', () => {
    const raw = ' '.repeat(GAME_DEFAULTS.nickname.maxInputLength + 1) + 'Lan';
    expect(validateNickname(raw)).toEqual({ ok: false, reason: 'too_long' });
    const huge = 'a'.repeat(100_000);
    expect(validateNickname(huge)).toEqual({ ok: false, reason: 'too_long' });
  });

  it('checks length before charset (a 1-code-point emoji is too_short)', () => {
    expect(validateNickname('😀')).toEqual({ ok: false, reason: 'too_short' });
  });
});

describe('validateNickname allowed characters', () => {
  it.each([
    ['😀😀'],
    ['<script>'],
    ['a‮b'],
    ['ab\u0000'],
    ['a‍b'],
    ['a​b'],
    ['á́́b'],
    ['Lan@Anh'],
  ])('rejects %j as bad_chars', (raw) => {
    expect(validateNickname(raw)).toEqual({ ok: false, reason: 'bad_chars' });
  });

  it.each([[undefined], [null], [42], [{}], [['Lan']], [true]])(
    'rejects non-string %j as bad_chars',
    (raw) => {
      expect(validateNickname(raw)).toEqual({ ok: false, reason: 'bad_chars' });
    },
  );

  it('accepts a name made only of allowed punctuation (D-03 lists charset only)', () => {
    expect(validateNickname('...')).toEqual({ ok: true, value: '...' });
  });
});

describe('validateNickname must-accept fixtures (fairness)', () => {
  it('has at least 20 fixtures', () => {
    expect(MUST_ACCEPT.length).toBeGreaterThanOrEqual(20);
  });

  it.each(MUST_ACCEPT)('accepts %s', (name) => {
    expect(validateNickname(name).ok).toBe(true);
    expect(validateNickname(name.normalize('NFD')).ok).toBe(true);
    expect(validateNickname(name.toUpperCase()).ok).toBe(true);
  });
});

describe('blocklist enforcement', () => {
  it('keeps every list non-empty', () => {
    expect(BLOCKED_ACCENTED_TOKENS.length).toBeGreaterThan(0);
    expect(BLOCKED_FOLDED_TOKENS.length).toBeGreaterThan(0);
    expect(BLOCKED_FOLDED_SUBSTRINGS.length).toBeGreaterThan(0);
  });

  describe.each(BLOCKED_ACCENTED_TOKENS.map((t) => [t]))('accented token %s', (entry) => {
    it('is blocked as-is, uppercased, NFD, and inside other tokens', () => {
      const blocked = { ok: false, reason: 'blocked' };
      expect(validateNickname(entry)).toEqual(blocked);
      expect(validateNickname(entry.toUpperCase())).toEqual(blocked);
      expect(validateNickname(entry.normalize('NFD'))).toEqual(blocked);
      expect(validateNickname(`x ${entry} y`)).toEqual(blocked);
      expect(validateNickname(`x ${entry.toUpperCase()} y`)).toEqual(blocked);
      expect(validateNickname(`x ${entry.normalize('NFD')} y`)).toEqual(blocked);
    });
  });

  describe.each(BLOCKED_FOLDED_TOKENS.map((t) => [t]))('folded token %s', (entry) => {
    it('is blocked alone, inside other tokens, uppercased and with digit substitutions', () => {
      const blocked = { ok: false, reason: 'blocked' };
      expect(validateNickname(entry)).toEqual(blocked);
      expect(validateNickname(entry.toUpperCase())).toEqual(blocked);
      expect(validateNickname(`x ${entry} y`)).toEqual(blocked);
      expect(validateNickname(leetify(entry))).toEqual(blocked);
      expect(validateNickname(`x ${leetify(entry)} y`)).toEqual(blocked);
    });
  });

  describe.each(BLOCKED_FOLDED_SUBSTRINGS.map((t) => [t]))('folded substring %s', (entry) => {
    it('is blocked alone, inside longer text, with separators and with digit substitutions', () => {
      const blocked = { ok: false, reason: 'blocked' };
      expect(validateNickname(entry)).toEqual(blocked);
      expect(validateNickname(entry.toUpperCase())).toEqual(blocked);
      expect(validateNickname(`xx${entry}yy`)).toEqual(blocked);
      expect(validateNickname(dotted(entry))).toEqual(blocked);
      expect(validateNickname(leetify(entry))).toEqual(blocked);
    });
  });

  it('checks blocked last: length and charset problems win', () => {
    const word = BLOCKED_FOLDED_TOKENS[0] ?? 'x';
    expect(validateNickname(`${word}<`)).toEqual({ ok: false, reason: 'bad_chars' });
    expect(validateNickname(`${word}${'z'.repeat(GAME_DEFAULTS.nickname.maxLength)}`)).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });
});

describe('blocklist hygiene', () => {
  const fixtureWords = MUST_ACCEPT.flatMap((n) =>
    foldNickname(n).split(/[^a-z0-9]+/).filter(Boolean),
  );

  it('accented entries are their own NFC lowercase form', () => {
    for (const e of BLOCKED_ACCENTED_TOKENS) {
      expect(e).toBe(e.normalize('NFC').toLowerCase());
      expect(e).toMatch(/^[\p{L}\p{N}]+$/u);
    }
  });

  it('folded entries are plain [a-z0-9] and already folded', () => {
    for (const e of BLOCKED_FOLDED_TOKENS) {
      expect(e).toMatch(/^[a-z0-9]+$/);
      expect(foldNickname(e)).toBe(e);
    }
  });

  it('folded entries contain no digits (digits are leet-mapped before matching)', () => {
    for (const e of BLOCKED_FOLDED_TOKENS) expect(e).toMatch(/^[a-z]+$/);
  });

  it('substring entries are 5+ letters and short enough to be typed as a nickname', () => {
    for (const e of BLOCKED_FOLDED_SUBSTRINGS) {
      expect(e).toMatch(/^[a-z]{5,}$/);
      expect(dotted(e).length).toBeLessThanOrEqual(GAME_DEFAULTS.nickname.maxLength);
    }
  });

  it('no folded token equals a folded word from the must-accept fixtures', () => {
    for (const e of BLOCKED_FOLDED_TOKENS) expect(fixtureWords).not.toContain(e);
  });

  it('no substring entry occurs inside a must-accept fixture', () => {
    for (const name of MUST_ACCEPT) {
      const compact = foldNickname(name).replace(/[^a-z]/g, '');
      for (const e of BLOCKED_FOLDED_SUBSTRINGS) expect(compact).not.toContain(e);
    }
  });

  it('entries are unique within each list', () => {
    for (const list of [BLOCKED_ACCENTED_TOKENS, BLOCKED_FOLDED_TOKENS, BLOCKED_FOLDED_SUBSTRINGS]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });
});

describe('foldNickname / isBlockedNickname', () => {
  it('folds diacritics, đ/Đ and case', () => {
    expect(foldNickname('Đụ Mẹ ĐỒ')).toBe('du me do');
    expect(foldNickname('Nguyễn'.normalize('NFD'))).toBe('nguyen');
  });

  it('isBlockedNickname is false for ordinary names', () => {
    expect(isBlockedNickname('Lan Anh')).toBe(false);
    expect(isBlockedNickname('Lớn')).toBe(false);
  });
});
