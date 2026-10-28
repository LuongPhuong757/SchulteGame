---
phase: 01-khung-repo-ch-i-1-m-nh-local
fixed_at: 2026-10-28T15:30:00Z
review_path: /Users/m1macbook/Desktop/SchulteGame/.planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 6
skipped: 1
status: partial
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-10-28T15:30:00Z
**Source review:** /Users/m1macbook/Desktop/SchulteGame/.planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, WR-01..WR-07)
- Fixed: 6
- Skipped: 1 (WR-07, deferred to Phase 2)

**Verification environment:** main checkout on branch `gsd/phase-1-khung-repo` (no isolated worktree). The orchestrator asked for the current branch and for `npm test`, `npm run typecheck` and `npm run build` to run after each fix. A hand-rolled worktree has no `node_modules`, so those gates could not run there. After every fix, under Node 24.20.0: `vitest run` passed (183 tests at baseline, 227 at the end), `npm run typecheck` showed no errors, and `npm run build` passed. Only the files for each finding were committed, and the pre-existing modified `01-UAT.md` and untracked files were left alone.

## Fixed Issues

### CR-01: GameResult omits the start timestamp, so the tap log is not replayable

**Files modified:** `client/src/screens/GameScreen.tsx`, `client/src/screens/GameScreen.test.tsx`, `client/src/i18n/vi.test.tsx`, `shared/src/game.ts`, `shared/src/game.test.ts`
**Commit:** 728ea28
**Applied fix:** Added `startedAt` to `GameResult`, filled from `state.startedAt`. Added a shared `replay(seed, size, startT, taps)` helper in `shared/src/game.ts`. Tests check that replaying a `GameResult` reproduces `finalMs`, and that wrong taps are counted the same way as in the live game.

### WR-01: Reducer silently drops invalid events and has no plausibility bounds

**Files modified:** `shared/src/game.ts`, `shared/src/game.test.ts`
**Commit:** 8672260
**Status:** fixed: requires human verification (logic)
**Applied fix:** Added `replayStrict(seed, size, startT, taps, { minTapIntervalMs, maxDurationMs })`, which returns `{ok, state}` or `{ok: false, reason}`. It rejects:
- timestamps outside `[0, 1e12]` (this prevents the `Infinity` overflow);
- decreasing timestamps;
- non-integer, out-of-range or already-found values;
- taps after the game finished;
- incomplete logs;
- gaps below the minimum interval;
- runs longer than the maximum duration (default 1 hour).

Wrong taps with `value > next` are accepted as legitimate. `gameReducer` stays lenient for the UI. Defaults are `minTapIntervalMs = 0` and `maxDurationMs = 1 h`, so the Phase 2 server should choose real thresholds.

### WR-02: Blocklist false positives contradict the documented policy

**Files modified:** `shared/src/nickname.ts`, `shared/src/nickname.test.ts`
**Commit:** b186b87
**Status:** fixed: requires human verification (logic)
**Applied fix:** Only matching logic changed; the blocklist is unchanged. A substring entry now matches when it lies inside one token, or when it spans several tokens and starts and ends exactly on token boundaries. "Edit Me", "Bacon Cacao" and "Falcon Cactus" are now accepted and were added to `MUST_ACCEPT`. "dit me", "d.i.t.m.e" and "Con Cac" are still blocked. The hygiene test "no substring entry occurs inside a must-accept fixture" now checks per token, because the new multi-word fixtures contain entries across a word boundary on purpose.

### WR-03: Homoglyph, fullwidth and mathematical-alphabet bypass

**Files modified:** `shared/src/nickname.ts`, `shared/src/nickname.test.ts`
**Commit:** a8a6929
**Status:** fixed: requires human verification (logic)
**Applied fix:** Matching logic only; blocklist entries are unchanged, including `dm`.
- The blocklist check now runs on the NFKC form of the name. The stored value stays NFC, so locked decision D-03 is honored.
- Added a small Cyrillic and Greek lookalike-to-Latin table, applied for matching only.
- Every list is also matched on a "squeezed" form where repeated characters collapse to one, with entries squeezed too. This catches "fuuck", "fuuuck" and "bulllshit".
- Runs of 3 or more single-character tokens are read as one word ("f u c k"). Two initials such as "A B" are not.

Not done: rejecting homoglyph characters outright, or script restriction. D-03 allows any letter, so the validator still accepts Cyrillic and fullwidth names. They just cannot dodge the blocklist. Impersonation (two visually identical names) is not addressed. That belongs with the Phase 2 uniqueness design.

### WR-04: Right-click and non-primary pointers register as taps

**Files modified:** `client/src/components/Board.tsx`, `client/src/components/Board.test.tsx`, `client/src/screens/GameScreen.test.tsx`, `client/src/App.test.tsx`
**Commit:** fcd96a9
**Applied fix:** `handlePointerDown` now returns early when `event.button > 0` or `event.isPrimary === false`. The board also suppresses the context menu. The `=== false` and `> 0` forms are deliberate so environments that omit those fields still work. The test helpers now send `{button: 0, isPrimary: true}`, because jsdom's default PointerEvent has `isPrimary=false`. Tests were added for right-click, middle-click, a non-primary pointer and the context menu.

### WR-05: Keyboard play drops focus and does not filter auto-repeat

**Files modified:** `client/src/components/Board.tsx`, `client/src/components/Board.test.tsx`, `client/src/styles.css`
**Commit:** 91d9bed
**Applied fix:**
- `handleKeyDown` ignores `event.repeat`.
- Cells are always keyed by `value`, so the wrong-tap flash no longer remounts the node. The flash restarts by alternating between two identical keyframes (`wrong-flash-0` and `wrong-flash-1`) by `flash.key` parity.
- After a correct keyboard tap, focus moves to the next playable cell in DOM order, wrapping around. This replaces the focus loss when the tapped cell becomes disabled.
- Found cells keep `disabled` and `aria-hidden`, as D-01 specifies.
- Tests cover auto-repeat, the focused node surviving flash start, repeat and end, and focus handoff after a correct tap.

### WR-06: Tests that cannot fail

**Files modified:** `client/src/App.test.tsx`, `client/src/screens/ResultScreen.test.tsx` (new)
**Commit:** 103c404
**Applied fix:** Removed the self-referential `toContain('1')` assertion and the pure-function "omits the penalty part" test from `App.test.tsx`. Added `ResultScreen.test.tsx`, which renders `ResultScreen`. With `wrongCount: 0` it asserts that no `×` is present. With wrong taps it asserts that the `×` part shows the count and raw time. It uses an explicit `cleanup()` in `afterEach`.

## Skipped Issues

### WR-07: Replay-relevant timing relies on a client-generated seed and a 32-bit hash

**File:** `client/src/lib/seed.ts:2-4`, `shared/src/board.ts:4-11`
**Reason:** Deferred to Phase 2. The fix is to have the server generate, store or sign the seed per round and reject submissions for unknown seeds, and that server code does not exist in local-only Phase 1. In solo mode there is no ranked result to protect. The reviewer called this harmless in Phase 1. Nothing meaningful can change in the client alone, so no code was changed. The 32-bit `hashSeed` collision point should be settled together with the Phase 2 server-issued seed design.
**Original issue:** The seed is client-chosen, so a client could grind seeds offline to pick an easy layout. `hashSeed` also reduces the 64-bit seed space to 2^32 boards.

---

_Fixed: 2026-10-28T15:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
