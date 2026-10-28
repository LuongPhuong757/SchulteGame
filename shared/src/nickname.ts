// Shared nickname validator (ID-01, D-03, D-04). Pure: no DOM or Node APIs, so
// the client and the Phase 2 server apply the identical filter. Returns reason
// codes only; the client maps them to Vietnamese text.
import { GAME_DEFAULTS } from './config';
import {
  BLOCKED_ACCENTED_TOKENS,
  BLOCKED_FOLDED_SUBSTRINGS,
  BLOCKED_FOLDED_TOKENS,
} from './nickname-blocklist';

export type NicknameError = 'too_short' | 'too_long' | 'bad_chars' | 'blocked';
export type NicknameResult = { ok: true; value: string } | { ok: false; reason: NicknameError };

// Letters (incl. Vietnamese), digits, space, underscore, dot, hyphen. No \p{M}:
// after NFC every Vietnamese letter is precomposed, so leftover combining marks
// only come from stacking abuse. Control, format (bidi, zero-width) and emoji
// characters are outside the class. One class, one quantifier: linear time.
const ALLOWED = /^[\p{L}\p{N} _.\-]+$/u;

const LEET_MAP: Readonly<Record<string, string>> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a' };

const accentedTokens = new Set(BLOCKED_ACCENTED_TOKENS);
const foldedTokens = new Set(BLOCKED_FOLDED_TOKENS);

/** NFD, strip combining marks, đ/Đ -> d/D (NFD does not decompose them), lowercase. */
export function foldNickname(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** `normalized` is the NFC, whitespace-collapsed nickname. */
export function isBlockedNickname(normalized: string): boolean {
  // (a) accented whole-token match, diacritics kept
  const accented = normalized.normalize('NFC').toLowerCase().split(/[^\p{L}\p{N}]+/u);
  if (accented.some((t) => accentedTokens.has(t))) return true;

  // (b) folded whole-token match after digit substitution
  const folded = foldNickname(normalized).replace(/[0134]/g, (d) => LEET_MAP[d] ?? d);
  if (folded.split(/[^a-z0-9]+/).some((t) => foldedTokens.has(t))) return true;

  // (c) long compacted insults anywhere in the separator-stripped string
  const compact = folded.replace(/[^a-z]+/g, '');
  return BLOCKED_FOLDED_SUBSTRINGS.some((w) => compact.includes(w));
}

export function validateNickname(raw: unknown): NicknameResult {
  if (typeof raw !== 'string') return { ok: false, reason: 'bad_chars' };
  // Cheap guard before any normalization; the server reuses this on untrusted input.
  if (raw.length > GAME_DEFAULTS.nickname.maxInputLength) return { ok: false, reason: 'too_long' };

  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  const length = [...s].length; // code points, not UTF-16 units
  if (length < GAME_DEFAULTS.nickname.minLength) return { ok: false, reason: 'too_short' };
  if (length > GAME_DEFAULTS.nickname.maxLength) return { ok: false, reason: 'too_long' };
  if (!ALLOWED.test(s)) return { ok: false, reason: 'bad_chars' };
  if (isBlockedNickname(s)) return { ok: false, reason: 'blocked' };
  return { ok: true, value: s };
}
