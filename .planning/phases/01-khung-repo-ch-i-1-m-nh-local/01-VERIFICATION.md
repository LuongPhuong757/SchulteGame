---
phase: 01-khung-repo-ch-i-1-m-nh-local
verified: 2026-10-28T15:45:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-01-PLAN.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-01-SUMMARY.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-02-PLAN.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-02-SUMMARY.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-03-PLAN.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-03-SUMMARY.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-04-PLAN.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-04-SUMMARY.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-05-PLAN.md"
  - ".planning/phases/01-khung-repo-ch-i-1-m-nh-local/01-05-SUMMARY.md"
  - "client/index.html"
  - "client/src/App.tsx"
  - "client/src/components/Board.tsx"
  - "client/src/components/Timer.tsx"
  - "client/src/i18n/vi.ts"
  - "client/src/lib/haptics.ts"
  - "client/src/lib/seed.ts"
  - "client/src/lib/storage.ts"
  - "client/src/main.tsx"
  - "client/src/screens/GameScreen.tsx"
  - "client/src/screens/MenuScreen.tsx"
  - "client/src/screens/ResultScreen.tsx"
  - "client/src/styles.css"
  - "package.json"
  - "server/src/index.ts"
  - "shared/src/board.ts"
  - "shared/src/config.ts"
  - "shared/src/game.ts"
  - "shared/src/index.ts"
  - "shared/src/nickname-blocklist.ts"
  - "shared/src/nickname.ts"
  - "shared/src/time.ts"
covered_digest: "v1:sha256:8a80de884ce5bcb0746335feae7c5decaaef182aaaed244ba6e31b1d880d8702"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 4/5
  gaps_closed:
    - "SC1 (mobile layout, touch sizing, Vietnamese UI): physical-phone UAT passed (01-UAT.md test 1, 2)"
    - "Judgment-tier prohibitions: UAT test 3 passed (no strobe, names not rejected, no echo, no data leaves device)"
    - "WR-02 nickname false positives: fixed in b186b87, confirmed by verifier run and UAT test 4"
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "Server-issued seed and 32-bit hash collision point (WR-07, skipped in 01-REVIEW-FIX.md)"
    addressed_in: "Phase 2"
    evidence: "Phase 2 SC1 'bảng dựng từ seed do server cấp', SC3 'Nộp nhật ký giả ... bị server từ chối'; REQ SOLO-02, SOLO-03"
---

# Phase 1: Khung repo + Chơi 1 mình (local) Verification Report

**Phase Goal:** Người chơi chơi được một ván Schulte hoàn chỉnh trên điện thoại ngay trên máy local, không cần server.
**Verified:** 2026-10-28T15:45:00Z
**Status:** passed
**Re-verification:** Yes. The previous report was stale because code-review fix commits 728ea28..103c404 landed after it. The report was refreshed against the current code, and the human items were closed by 01-UAT.md.

## Goal Achievement

Gates run by the verifier under Node 24.20.0 on branch `gsd/phase-1-khung-repo`:

- `npm test`: 13 files, 227 tests pass (183 at the earlier verification).
- `npm run typecheck`: clean for shared, client and server.
- `npm run build`: vite builds 32 modules, 72.78 kB gzip JS.
- `npm run start -w @schulte/server`: prints the shared config and exits 0.

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Open on phone, valid nickname, choose 4x4/5x5/6x6, see random 1..N board, big tappable cells, Vietnamese, no hover | ✓ VERIFIED | Code: `MenuScreen` size toggle; verifier ran `generateBoard('x1', n)`: 16/25/36 unique values, min 1, max N. `styles.css` has touch-action, 44px cells, user-select none; guard test forbids `:hover`; `vi.test.tsx` enforces Vietnamese-only. Device behavior: 01-UAT.md test 1 (Android Chrome + iPhone Safari, ~360px, 4x4/5x5/6x6) and test 2 (landscape 6x6, resolves IN-05) both pass, performed by the user. |
| 2 | Tap 1 -> N in order, see completion time | ✓ VERIFIED | Verifier replay through the shared reducer with 1 wrong tap then 1..16: `status finished`, `wrongCount 1`, raw 2100 ms (+2000 penalty applied by `finalTimeMs`). `GameScreen` -> `ResultScreen` wiring intact; `App.test.tsx` full flow passes. |
| 3 | Wrong tap: cell flashes red, phone vibrates, +2 s, `next` unchanged | ✓ VERIFIED | Reducer: wrong tap increments `wrongCount`, leaves `next`. `GameScreen.tsx:53` calls `vibrate(GAME_DEFAULTS.ui.wrongVibrateMs)` on `wrongCount` change; `vitest -t vibrate` 5 passed. Flash now by `flash.key` parity without remount (WR-05), tested. Real-device haptics: UAT test 1 pass. |
| 4 | Too-long / odd-char / profane nickname rejected with message; valid nickname prefilled on reopen | ✓ VERIFIED | Verifier ran `validateNickname`: `a` too_short, 17 chars too_long, `<script>` bad_chars, `địt`/`dit me`/`fuuck` blocked, `Đạt`/`Lan Anh`/`Nguyễn Văn A`/`Long` accepted, and `Edit Me`/`Bacon Cacao` now accepted (WR-02 fixed). `storage.ts` validates on load/save; App prefill tested; UAT test 1 confirms reload prefill. |
| 5 | Own repo (client + server skeleton); all defaults in one config file | ✓ VERIFIED | Repo toplevel is `SchulteGame`; workspaces exactly shared/client/server; no `file:`/`link:`/`../` dependency specs in package.json files. Grep: no `2000/15000/600000` literals outside `shared/src/config.ts` and tests. Server skeleton runs and exits 0. `repo-guards.test.ts` passes. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

Plan-level must-haves re-checked after the fixes: D-01 found cells stay empty and inert (`Board.tsx` renders `cell--found`, `disabled`, `aria-hidden` for `value < next`); single input path (pointerdown + keyboard, the only `onClick` handlers are menu/result buttons, none on cells); non-primary buttons and pointers ignored; `event.repeat` ignored; keyboard focus handed to next unfound cell; no network or raw-HTML API in client/shared sources (grep clean).

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | Server-issued seed and 32-bit hash collision (WR-07) | Phase 2 | Phase 2 SC1 server-issued seed, SC3 forged logs rejected; SOLO-02, SOLO-03. No server exists in Phase 1 and solo mode has no ranked result to protect. |

CR-01 (`startedAt` in `GameResult`, shared `replay`) and WR-01 (`replayStrict`) are now fixed in the code, not deferred.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `shared/src/{config,board,game,time,nickname,nickname-blocklist,index}.ts` | ✓ VERIFIED | Substantive, exported via barrel, consumed by client and server. `game.ts` now exports `replay`, `replayStrict`. |
| `client/src/App.tsx`, `screens/{Menu,Game,Result}Screen.tsx`, `components/{Board,Timer}.tsx`, `lib/{storage,haptics,seed}.ts`, `i18n/vi.ts`, `styles.css`, `index.html` | ✓ VERIFIED | Wired menu -> playing -> result state machine; build succeeds. |
| `server/src/index.ts`, `server/src/repo-guards.test.ts` | ✓ VERIFIED | Skeleton runs and exits 0, opens no port; guards pass. |
| `client/src/screens/ResultScreen.test.tsx` (new) | ✓ VERIFIED | Renders the real `ResultScreen`; replaces tautological assertions (WR-06). |
| `package-lock.json`, `.node-version`, `vitest.config.ts`, `README.md` | ✓ VERIFIED | Present; three vitest projects run. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| App -> GameScreen -> Board | `<GameScreen key=seed>` -> `<Board>` | WIRED | Board receives `board/next/flash`, `onTap` dispatches reducer event. |
| GameScreen -> haptics | `vibrate(GAME_DEFAULTS.ui.wrongVibrateMs)` | WIRED | `GameScreen.tsx:53`. |
| GameScreen -> result | `onFinish({..., startedAt: state.startedAt ?? 0})` | WIRED | `GameScreen.tsx:62-65`; replay reproduces `finalMs` (tested). |
| MenuScreen -> nickname.ts | `validateNickname()` | WIRED | Reason codes mapped to `vi.nicknameErrors`. |
| App -> storage | `loadNickname()` / `saveNickname()` | WIRED | Prefill and save on start. |
| game.ts -> board.ts / config.ts | `generateBoard`, `GAME_DEFAULTS.wrongTapPenaltyMs` | WIRED | |
| server -> shared | `GAME_DEFAULTS` import | WIRED | Verified by running it. |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Board | `state.board` | `generateBoard(seed)`, `newSeed()` uses `crypto.getRandomValues` | Yes | FLOWING |
| Timer | elapsed | `performance.now()` - `startedAt` + penalty | Yes | FLOWING |
| ResultScreen | `finalMs`, `rawMs` | reducer state via `onFinish` | Yes | FLOWING |
| MenuScreen nickname | prefill | `localStorage` via `loadNickname` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Board is permutation 1..N | tsx script, `generateBoard('x1', 4/5/6)` | 16/25/36 unique, min 1, max N | PASS |
| Wrong tap + completion | tsx `replay` with 1 wrong tap then 1..16 | finished, wrongCount 1, raw 2100 | PASS |
| Strict replay | tsx `replayStrict` full vs truncated log | `ok: true` vs `not_finished` | PASS |
| Nickname rules | tsx `validateNickname` set (see truth 4) | as expected | PASS |
| Vibrate behavior | `vitest run -t vibrate` | 5 passed | PASS |
| Server skeleton | `npm run start -w @schulte/server` | prints config, exit 0 | PASS |

### Probe Execution

Step 7c: SKIPPED (no `probe-*.sh` declared or present).

### Requirements Coverage

All 10 phase IDs are claimed by PLAN frontmatter and mapped to Phase 1 in REQUIREMENTS.md (checked `[x]` and "Complete" in the traceability table); no orphans.

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| BOARD-01 | 01-02 | ✓ SATISFIED | `generateBoard` permutation for 4/5/6, golden vectors, menu size choice |
| BOARD-02 | 01-02, 01-03 | ✓ SATISFIED | Clock start/stop, final time on result screen; replay spot-check |
| BOARD-03 | 01-02, 01-03 | ✓ SATISFIED | +2 s via `GAME_DEFAULTS`, red flash, vibrate tests; UAT on device |
| UI-01 | 01-03, 01-05 | ✓ SATISFIED | CSS/markup plus UAT tests 1 and 2 on a physical phone |
| UI-02 | 01-03, 01-05 | ✓ SATISFIED | `vi.ts` only; source-scan and render guards pass |
| ID-01 | 01-04, 01-05 | ✓ SATISFIED | Shared `validateNickname` used by client; server reuse arrives in Phase 2 by design |
| ID-02 | 01-04, 01-05 | ✓ SATISFIED | localStorage prefill, fault-tolerant, tested, UAT-confirmed |
| SOLO-01 | 01-02, 01-05 | ✓ SATISFIED | Full local loop, no network (grep and guard test) |
| OPS-07 | 01-01, 01-05 | ✓ SATISFIED | Own toplevel, in-repo dependencies only, guard test |
| OPS-08 | 01-02, 01-05 | ✓ SATISFIED | `GAME_DEFAULTS` single file, guard test, grep clean |

### Judgment-tier Prohibitions (non-authoritative verifier verdict, human-resolved)

| Prohibition | Verdict | Resolution |
|-------------|---------|------------|
| No whole-screen flash/strobe on wrong tap (01-03) | No violation: single `cell--wrong` cell, one 300 ms pulse | Resolved by user, UAT test 3 pass |
| Do not reject common Vietnamese names (01-04) | `Đạt`, `Lan Anh`, `Nguyễn Văn A`, `Long`, `Edit Me`, `Bacon Cacao` accepted; the earlier WR-02 false positive is fixed | Resolved by user, UAT tests 3 and 4 pass |
| Do not echo rejected nickname / shaming wording (01-05) | No violation: neutral `vi.nicknameErrors.blocked`, test asserts no echo | Resolved by user, UAT test 3 pass |
| No data off device in Phase 1 (01-05) | No violation: no fetch/XHR/WebSocket/beacon in sources (grep clean), guard test passes | Resolved by user, UAT test 3 pass |

### Anti-Patterns Found

No TBD/FIXME/XXX/TODO/HACK in `client/src`, `shared/src` or `server/src`; no stubs; no hardcoded-empty render data. Review findings status:

| Finding | Status |
|---------|--------|
| CR-01, WR-01 (replay contract, strict replay) | Fixed (728ea28, 8672260), tests pass |
| WR-02, WR-03 (blocklist false positives, homoglyph bypass) | Fixed (b186b87, a8a6929); verifier confirmed `fuuck` blocked, `Edit Me` accepted |
| WR-04, WR-05 (non-primary pointer, focus and key repeat) | Fixed (fcd96a9, 91d9bed); code inspected in `Board.tsx` |
| WR-06 (tautological tests) | Fixed (103c404) |
| WR-07 (client seed, 32-bit hash) | Skipped, deferred to Phase 2 (see Deferred Items) |
| IN-05 (landscape 6x6 overflow) | Resolved by UAT test 2 |
| IN-01..IN-04, IN-06 | Info only, no impact on the goal |

Residual, non-blocking: impersonation by visually identical names is not addressed (belongs to Phase 2 uniqueness design, accepted risk AR-04 in 01-SECURITY.md). `npm run build` still does not typecheck (IN-05 build note); `npm run typecheck` is a separate gate and is clean.

### Human Verification Required

None. The two prior human items are closed: physical-phone UAT (01-UAT.md tests 1 and 2, performed by the user) and the judgment-tier prohibition review (tests 3 and 4). 01-SECURITY.md reports `threats_open: 0`.

### Gaps Summary

No gaps. All 5 roadmap success criteria are verified against the current code: the full solo loop (menu, nickname validation and prefill, board sizes, ordered tapping, wrong-tap penalty/flash/vibrate, result, replay), the one-file config, repo independence and the server skeleton are present, wired, exercised by 227 passing tests and verifier spot-checks, and confirmed on a physical phone. The code-review fixes did not regress any must-have. WR-07 is the only open review item, and it is correctly scheduled for Phase 2.

---

_Verified: 2026-10-28T15:45:00Z_
_Verifier: Claude (gsd-verifier)_
