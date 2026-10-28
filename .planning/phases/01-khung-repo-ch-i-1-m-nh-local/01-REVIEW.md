---
phase: 01-khung-repo-ch-i-1-m-nh-local
reviewed: 2026-10-28T14:55:00Z
depth: standard
files_reviewed: 38
files_reviewed_list:
  - client/index.html
  - client/src/App.tsx
  - client/src/components/Board.tsx
  - client/src/components/Timer.tsx
  - client/src/i18n/vi.ts
  - client/src/lib/haptics.ts
  - client/src/lib/seed.ts
  - client/src/lib/storage.ts
  - client/src/main.tsx
  - client/src/screens/GameScreen.tsx
  - client/src/screens/MenuScreen.tsx
  - client/src/screens/ResultScreen.tsx
  - client/src/styles.css
  - client/vite.config.ts
  - server/src/index.ts
  - shared/src/board.ts
  - shared/src/config.ts
  - shared/src/game.ts
  - shared/src/index.ts
  - shared/src/nickname-blocklist.ts
  - shared/src/nickname.ts
  - shared/src/time.ts
  - package.json
  - client/package.json
  - server/package.json
  - shared/package.json
  - tsconfig.base.json
  - client/tsconfig.json
  - server/tsconfig.json
  - shared/tsconfig.json
  - vitest.config.ts
  - client/src/App.test.tsx
  - client/src/components/Board.test.tsx
  - client/src/i18n/vi.test.tsx
  - client/src/lib/storage.test.ts
  - client/src/screens/GameScreen.test.tsx
  - client/src/screens/MenuScreen.test.tsx
  - server/src/repo-guards.test.ts
  - shared/src/board.test.ts
  - shared/src/config.test.ts
  - shared/src/game.test.ts
  - shared/src/nickname.test.ts
  - shared/src/time.test.ts
findings:
  critical: 1
  warning: 6
  info: 6
  total: 13
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-28
**Depth:** standard
**Files Reviewed:** 43 (listed; 12 test files read at lower priority)
**Status:** issues_found

## Summary

Baseline: `vitest run` (183 tests) and `npm run typecheck` pass on Node 24.20.0. The board generator (FNV-1a + mulberry32 + Fisher-Yates) is deterministic: it uses only integer ops, `Math.imul`, and IEEE division by 2^32, with no `Math.random`, `Date` or locale dependence. The reducer is pure. No XSS vectors (React escaping, no raw HTML), no secrets, no network calls.

The main problems:
- The result object cannot support Phase 2 server replay.
- The reducer silently swallows invalid events, so a server cannot tell a tampered log from a valid one.
- The blocklist has proven false positives and trivial bypasses.
- Board input handling has real usability defects (right-click counts as a tap, keyboard focus is dropped after every tap).

No structural (fallow) findings were supplied.

## Critical Issues

### CR-01: GameResult omits the start timestamp, so the tap log is not replayable

**File:** `client/src/screens/GameScreen.tsx:15-26, 60-68` (and `shared/src/game.ts:4, 40-43`)
**Issue:** `GameResult.taps` is documented as "Kept for Phase 2 submission". `TapEvent.t` holds absolute `performance.now()` values (page-origin relative). The `start` event's `t` (`state.startedAt`) is not included in the result, and `finishedAt` is not either. A server running `gameReducer` over `[start, ...taps]` has no `start.t`. It cannot recompute `rawTimeMs`, and it cannot validate the first tap's `t >= startedAt` guard. The only available time is the client-asserted `rawMs`, which is exactly what anti-cheat must not trust. This breaks the stated "deterministic replay" contract.
**Fix:** Either carry `startedAt` in the result and the submission payload, or make the log self-contained and relative:
```ts
export interface GameResult {
  // ...
  startedAt: number;        // state.startedAt
  taps: readonly TapEvent[];
}
// or: record taps as t - startedAt and replay with { type: 'start', t: 0 }
```
Add a shared `replay(seed, size, startT, taps): GameState` helper plus a test that `replay(result...)` reproduces `finalMs`, so the contract is enforced in `shared/`.

## Warnings

### WR-01: Reducer silently drops invalid events and has no plausibility bounds, so it is unsuitable as a server verifier as-is

**File:** `shared/src/game.ts:41-50`
**Issue:**
- Every rejected event (`non-finite t`, `t` going backwards, non-integer or out-of-range value, `value < next`) returns the same `state`. A server replaying an untrusted log cannot distinguish "log is valid" from "log contained garbage that was ignored". A forged log padded with ignored events replays to a valid-looking state.
- `Number.isFinite` accepts any finite `t`, including negative and astronomically large values. `startedAt = -1e308` with a later tap at `1e308` gives `rawTimeMs = Infinity` (overflow). `formatTime` then throws `RangeError` and `finalTimeMs` compares as `Infinity`.
- Nothing bounds inter-tap spacing or total duration. All 16 taps at the same `t` yield a final time of 0 ms.
- `value < state.next` is a deliberate no-op (D-01), but a real client never logs it, so a server should treat it as tampering rather than ignore it.

**Fix:** Add a strict replay entry point in shared that rejects instead of ignoring:
```ts
export function replayStrict(...): { ok: true; state: GameState } | { ok: false; reason: string }
```
It should require `t` to be within a sane range and non-decreasing, reject `value < next`, and have caller-supplied min tap interval and max duration. Keep `gameReducer` lenient for the UI.

### WR-02: Blocklist false positives contradict the documented "false negatives preferred" policy

**File:** `shared/src/nickname.ts:45-47`, `shared/src/nickname-blocklist.ts:55-63`
**Issue:** Check (c) matches substrings of the string with all separators removed, so a match can span word boundaries. Verified by running `validateNickname`:
- "Edit Me" gives `blocked` (contains `ditme`)
- "Bacon Cacao" gives `blocked` (contains `concac`)
- "Falcon Cactus" gives `blocked` (contains `concac`)

The blocklist header says a false positive on a real name is worse than a miss, and the comment says these substrings are "unambiguous even inside other text". That is false when separators are stripped. The existing `MUST_ACCEPT` fixtures do not cover multi-word names.
**Fix:** Run the substring check per token (`folded.split(/[^a-z0-9]+/)`), or per whole string only when the original has no separators. Add multi-word fixtures ("Edit Me", "Bacon Cacao") to `MUST_ACCEPT`.

### WR-03: Nickname validator accepts homoglyph, fullwidth and mathematical-alphabet letters, so the blocklist and uniqueness are trivially bypassed

**File:** `shared/src/nickname.ts:18, 55`
**Issue:** `\p{L}`/`\p{N}` admit lookalikes. Verified accepted: Cyrillic `fuсk`, fullwidth `ｆｕｃｋ`, mathematical bold `𝐟𝐮𝐜𝐤`, Arabic-Indic digits, `½½`. Only NFC is applied, and NFKC or confusable folding is not. Repetition (`fuuck`) and single-char separation (`f u c k`) also pass. The validator is meant to be the shared server filter in Phase 2 (leaderboard and room display). The same gap affects impersonation (two players with visually identical names).
**Fix:**
- Apply `normalize('NFKC')` before the length, charset and blocklist checks and store that value.
- For the blocklist, fold a small confusables table (Cyrillic а/е/о/с/р/х to Latin) and collapse runs of 3+ identical letters.
- Optionally restrict scripts to Latin plus the Vietnamese set, since D-03 says "letters incl. Vietnamese diacritics".

If the draft is intentionally "basic", record this limitation in the checkpoint notes so it is a conscious decision.

### WR-04: Right-click and non-primary pointers register as taps

**File:** `client/src/components/Board.tsx:44-48`
**Issue:** `onPointerDown` fires for any button (mouse right/middle click) and any pointer. A right-click or middle-click on a wrong cell adds a +2 s penalty and a log entry, and on the correct cell advances the game, because `event.button` and `isPrimary` are never checked. Desktop (the dev server is browsable) is affected, and the context menu then appears over the board.
**Fix:**
```ts
if (event.button !== 0 || !event.isPrimary) return; // before onTap
```
Keep the existing `preventDefault`. Optionally add `onContextMenu={(e) => e.preventDefault()}` on `.board`.

### WR-05: Keyboard play is effectively broken: cells remount on every state change, dropping focus, and key auto-repeat is not filtered

**File:** `client/src/components/Board.tsx:37-41, 49-54`
**Issue:**
- A wrong tap changes the cell key (`${value}-${flash.key}`), which remounts the button. A correct tap turns the same button into a `disabled` one, which also loses focus. After every keyboard activation focus falls to `<body>`, so the player must Tab from the top again. The 300 ms flash end remounts the cell a second time (key reverts to `value`).
- `handleKeyDown` does not check `event.repeat`. Holding Enter or Space on a focused cell fires repeated taps, so holding the key on a wrong cell racks up multiple +2 s penalties until the first remount happens.

**Fix:**
- Ignore auto-repeat: `if (event.repeat) return;`
- Restart the flash animation without remounting the focused node (toggle a class via a ref and `requestAnimationFrame`, or use a `data-flash-key` attribute with a CSS animation name swap).
- Use `aria-disabled` rather than `disabled` for found cells if focus must be preserved.

### WR-06: Tests that cannot fail (tautologies) weaken the stated guards

**File:** `client/src/App.test.tsx:75, 108-111`
**Issue:**
- Line 75 asserts `vi.result.breakdown(...)` `toContain('1')` on a string the test itself built. It checks nothing about what was rendered.
- The test named "result breakdown omits the penalty part when there were no wrong taps" (108-111) only calls the pure `vi.ts` function, not `ResultScreen`. A regression in the rendered screen (for example passing the wrong `wrongCount`) would not be caught. It is also nested under a "full solo flow" `describe`.

**Fix:** Delete the line 75 assertion. Render `ResultScreen` with `wrongCount: 0` and assert `queryByText(/×/)` is null (the real screen output). Move that test to a `ResultScreen` test file.

### WR-07: Replay-relevant timing relies on a client-generated seed and a 32-bit hash

**File:** `client/src/lib/seed.ts:2-4`, `shared/src/board.ts:4-11`
**Issue:** The seed is client-chosen. In Phase 2 competitive modes, a client can grind seeds offline to pick an easy layout, and the server cannot detect it unless it issues the seed (the file comment acknowledges a "server token" swap). Separately, `hashSeed` reduces any seed to 32 bits, so the 64-bit seed space collapses to 2^32 boards and distinct seeds can collide to identical boards. Both are harmless in solo-local Phase 1 but must be fixed before any server-verified result is trusted.
**Fix:** In Phase 2 the server must generate and sign or store the seed per round and reject submissions for unknown seeds. Document in `board.ts` that `seed` must be server-issued for ranked play.

## Info

### IN-01: ResultScreen derives the penalty from live config instead of the result

**File:** `client/src/screens/ResultScreen.tsx:19-23`, `client/src/screens/GameScreen.tsx:20-21, 65`
**Issue:** `GameResult.penaltyMs` is computed but never used. `ResultScreen` re-reads `GAME_DEFAULTS.wrongTapPenaltyMs`. When Phase 2 serves an effective (env-overridden) config (Pitfall 8), the breakdown line can disagree with the `finalMs` that was actually computed.
**Fix:** Pass `result.penaltyMs / result.wrongCount` (or store `penaltyPerTapMs` in the result) and use it in the breakdown.

### IN-02: Vietnamese decimal formatting and float math in vi.ts

**File:** `client/src/i18n/vi.ts:30-33, 39-40`
**Issue:** `penaltySeconds` and `count * penaltySeconds` are interpolated with `${}`. With a non-integer penalty (for example 2.5, plausible after env overrides) they render as "2.5" with a dot, inconsistent with `formatTime`'s decimal comma, and can produce float noise (`3 * 0.7`).
**Fix:** Format these through one helper (comma decimal, fixed precision).

### IN-03: Nicknames made only of separators are valid

**File:** `shared/src/nickname.ts:18, 59`
**Issue:** `"__"`, `".."` and `"--"` pass (verified). These are D-03-legal but give an effectively blank leaderboard name.
**Fix:** Require at least one `\p{L}` or `\p{N}`: `/[\p{L}\p{N}]/u.test(s)`.

### IN-04: `isBoardSize` duplicates `GAME_DEFAULTS.boardSizes`

**File:** `shared/src/config.ts:20-36`
**Issue:** The literal `4 | 5 | 6` check is separate from `boardSizes: [4, 5, 6]`. Adding a size in one place leaves the other stale; the compile-time type follows the tuple but the runtime guard does not. `GAME_DEFAULTS` also mixes UI-only values (`ui.*`) into the object the server is meant to serve as "effective config".
**Fix:** `return (GAME_DEFAULTS.boardSizes as readonly unknown[]).includes(n)`. Consider splitting `ui` into a client-only constant.

### IN-05: Build does not typecheck; landscape layout can overflow

**File:** `package.json:14`, `client/package.json:9`, `client/src/styles.css:69, 84, 97`
**Issue:**
- `build` runs `vite build` only, which does not typecheck. A broken type can ship if `npm run typecheck` is skipped.
- `.board` width is `min(100vw - 24px, 100dvh - 180px)`. In landscape phones (about 360 px high) it is about 180 px wide, yet `.cell` has `min-height: 44px`, so a 6x6 board needs about 294 px and overflows its own box and the header.

**Fix:** `"build": "tsc --noEmit -p client && vite build"` (or a root script running typecheck first). Add a landscape media query (`orientation: landscape` and `max-height`) that lays the header beside the board or drops the 44 px floor.

### IN-06: Missing accessibility wiring and minor dead code

**File:** `client/src/screens/MenuScreen.tsx:34-54`, `client/src/screens/GameScreen.tsx:36, 55, 69`
**Issue:**
- The nickname input has no `aria-invalid` or `aria-describedby` linking to the error `<p role="alert">`.
- The `useEffect` hooks deliberately omit dependencies (`state`, `onFinish`) with only comments. No ESLint `react-hooks` rule exists to confirm that remains safe as the code evolves.

**Fix:** Add `aria-invalid={error !== null}` and `aria-describedby="nickname-error"` (with an `id` on the error). Consider adding eslint-plugin-react-hooks with targeted disables.

---

_Reviewed: 2026-10-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
