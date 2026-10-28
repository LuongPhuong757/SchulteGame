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

// Lookalike letters folded to Latin for blocklist matching only (WR-03). The
// validator still ACCEPTS these characters (D-03 allows any letter); they just
// cannot be used to dodge the blocklist. Cyrillic and Greek lowercase.
const CONFUSABLES: Readonly<Record<string, string>> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'с': 'c', 'р': 'p', 'х': 'x', 'у': 'y', 'і': 'i',
  'ѕ': 's', 'ј': 'j', 'һ': 'h', 'ԁ': 'd',
  'α': 'a', 'ε': 'e', 'ο': 'o', 'ι': 'i', 'ν': 'v', 'ρ': 'p',
};

/** Collapse every run of a repeated character to one ("fuuuck" -> "fuck"). */
const squeeze = (s: string): string => s.replace(/(.)\1+/gu, '$1');

// Each list is matched twice: as written, and squeezed on both sides, so
// repetition ("fuuck", "bulllshit") cannot dodge an entry.
const accentedTokens = new Set(BLOCKED_ACCENTED_TOKENS);
const accentedTokensSqueezed = new Set(BLOCKED_ACCENTED_TOKENS.map(squeeze));
const foldedTokens = new Set(BLOCKED_FOLDED_TOKENS);
const foldedTokensSqueezed = new Set(BLOCKED_FOLDED_TOKENS.map(squeeze));
const substringsSqueezed = BLOCKED_FOLDED_SUBSTRINGS.map(squeeze);

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
  // NFKC maps fullwidth and mathematical-alphabet letters to plain ones. Used
  // for matching only; the stored nickname stays NFC (D-03).
  const n = normalized.normalize('NFKC');

  // (a) accented whole-token match, diacritics kept
  const accented = n.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  if (accented.some((t) => accentedTokens.has(t) || accentedTokensSqueezed.has(squeeze(t)))) {
    return true;
  }

  // (b) folded whole-token match after confusable and digit substitution
  const folded = foldNickname(n)
    .replace(/[^\x00-\x7f]/g, (c) => CONFUSABLES[c] ?? c)
    .replace(/[0134]/g, (d) => LEET_MAP[d] ?? d);
  const tokens = folded.split(/[^a-z0-9]+/);
  // Runs of 3+ single-character tokens are also read as one word ("f u c k").
  const candidates = [...tokens, ...singleCharRuns(tokens)];
  if (candidates.some((t) => foldedTokens.has(t) || foldedTokensSqueezed.has(squeeze(t)))) {
    return true;
  }

  // (c) long compacted insults: inside one token, or spanning several tokens
  // only when the match starts AND ends on token boundaries (so "d.i.t.m.e" and
  // "dit me" are caught, but "Edit Me" / "Bacon Cacao" are not: their match
  // straddles a boundary mid-token).
  return (
    containsBlockedSubstring(tokens, BLOCKED_FOLDED_SUBSTRINGS) ||
    containsBlockedSubstring(tokens.map(squeeze), substringsSqueezed)
  );
}

function singleCharRuns(tokens: readonly string[]): string[] {
  const runs: string[] = [];
  let run: string[] = [];
  const flush = (): void => {
    if (run.length >= 3) runs.push(run.join(''));
    run = [];
  };
  for (const t of tokens) {
    if (t.length === 1) run.push(t);
    else flush();
  }
  flush();
  return runs;
}

function containsBlockedSubstring(rawTokens: readonly string[], words: readonly string[]): boolean {
  // Unmapped digits are dropped inside a token (e.g. "di2tme"), as before.
  const tokens = rawTokens.map((t) => t.replace(/[^a-z]/g, '')).filter((t) => t.length > 0);
  let compact = '';
  const tokenOf: number[] = [];
  const starts = new Set<number>();
  const ends = new Set<number>();
  tokens.forEach((token, index) => {
    starts.add(compact.length);
    for (let i = 0; i < token.length; i++) tokenOf.push(index);
    compact += token;
    ends.add(compact.length);
  });

  return words.some((word) => {
    for (let at = compact.indexOf(word); at !== -1; at = compact.indexOf(word, at + 1)) {
      const end = at + word.length;
      if (tokenOf[at] === tokenOf[end - 1]) return true;
      if (starts.has(at) && ends.has(end)) return true;
    }
    return false;
  });
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
