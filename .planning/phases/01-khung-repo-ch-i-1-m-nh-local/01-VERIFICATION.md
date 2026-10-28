---
phase: 01-khung-repo-ch-i-1-m-nh-local
verified: 2026-10-28T15:10:00Z
status: human_needed
score: 4/5 must-haves verified
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
covered_digest: "v1:sha256:9aafda4fae4583cceed41e77df9f9591a64db838a4dded5b8d371a8fb704cee6"
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "Tap log is replayable by a server (CR-01: GameResult omits startedAt; WR-01: lenient reducer swallows invalid events; WR-07: client-chosen seed, 32-bit hash)"
    addressed_in: "Phase 2"
    evidence: "Phase 2 SC1 'bảng dựng từ seed do server cấp', SC3 'Nộp nhật ký giả ... bị server từ chối'; REQ SOLO-02, SOLO-03"
human_verification:
  - test: "Phone UAT (01-05 Task 2 human-check, D6): run `fnm exec --using=24.20.0 -- npm run dev:phone`; open the Network URL on an Android phone (Chrome) and an iPhone (Safari). Enter a nickname, play 4x4, 5x5, 6x6, make 1-2 deliberate wrong taps in one game, then reload."
    expected: "At ~360 px every 6x6 cell is comfortably tappable (~44 px+); no double-tap zoom, no text selection/callout on long-press, no pull-to-refresh during play, input focus does not zoom; wrong tap flashes only that cell red and vibrates on Android (iPhone: flash only); found numbers disappear; result time = elapsed + 2 s per wrong tap and matches live timer; nickname prefilled after reload; all text Vietnamese."
    why_human: "jsdom has no layout, touch physics or haptics. NOT yet performed by the user."
  - test: "Judgment-tier prohibition review (unverified-prohibition, human review recommended): confirm accepting the nickname false positives 'Edit Me' and 'Bacon Cacao' (blocked by cross-word substring match) is acceptable for Phase 1, or fix WR-02 before Phase 2."
    expected: "Decision recorded: accept as known limitation, or schedule a fix (per-token substring check)."
    why_human: "Plan prohibition 'MUST NOT reject common Vietnamese names/everyday words' is judgment-tier; listed example names pass but a cross-word false positive exists."
---

# Phase 1: Khung repo + Chơi 1 mình (local) Verification Report

**Phase Goal:** Người chơi chơi được một ván Schulte hoàn chỉnh trên điện thoại ngay trên máy local, không cần server.
**Verified:** 2026-10-28
**Status:** human_needed (no blockers; physical-phone UAT pending)
**Re-verification:** No, initial verification

## Goal Achievement

Automated evidence was run by the verifier on Node 24.20.0: `npm test` 12 files / 183 tests pass; `npm run typecheck` clean (shared, client, server); `npm run build` succeeds (vite, 32 modules, 72 kB gzip JS); `npm run start -w @schulte/server` prints the shared config and exits 0.

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Open on phone, valid nickname, choose 4x4/5x5/6x6, see random 1..N board, big tappable cells, Vietnamese, no hover | ? UNCERTAIN (human) | Code OK: `MenuScreen` size toggle from `GAME_DEFAULTS.boardSizes`; `generateBoard` spot-check gives permutation of 1..16/25/36 for 4/5/6 (verifier ran it); viewport meta, `touch-action: manipulation`, `min-height: 44px`, `user-select: none` in `styles.css`; guard test forbids `:hover`; `vi.test.tsx` scans for Vietnamese-only. Touch size/zoom/callout on a real device cannot be proven in jsdom. |
| 2 | Tap 1 -> N in order, see completion time | ✓ VERIFIED | `gameReducer` + `GameScreen` -> `ResultScreen`; verifier replay: start 1000, wrong tap, 1..16 taps -> `status finished`, `finalTimeMs` 4600 (raw 2600 + 2000). `App.test.tsx` full flow passes. |
| 3 | Wrong tap: cell flashes red, phone vibrates, +2 s, `next` unchanged | ✓ VERIFIED (logic) | Reducer spot-check: wrong tap leaves `next=1`, `wrongCount=1`. `GameScreen` derives flash + `vibrate(GAME_DEFAULTS.ui.wrongVibrateMs)` from `wrongCount` change; `GameScreen.test.tsx` covers flash, vibrate, iOS-without-vibrate, flash clear; ran `-t vibrate` passes. Real-device haptics in human item 1. |
| 4 | Too-long / odd-char / profane nickname rejected with message; valid nickname prefilled on reopen | ✓ VERIFIED | Verifier ran `validateNickname`: 1 char -> too_short, 17 chars -> too_long, `<script>`/emoji -> bad_chars, `địt`/`dit me` -> blocked, `Long`/`Đạt`/`Lan Anh`/`Nguyễn Văn A` accepted. `MenuScreen` maps reason codes to `vi.nicknameErrors` (role=alert, no echo). `storage.ts` load/save with try/catch and re-validation; `App.tsx` `loadNickname()` prefill; storage + App tests pass. |
| 5 | Own repo (client + server skeleton); all defaults in one config file | ✓ VERIFIED | `git rev-parse --show-toplevel` = repo dir; workspaces exactly shared/client/server; no `file:/link:/../` deps; `.node-version` 24.20.0. `GAME_DEFAULTS` (deep-frozen) holds penalty, grab lock, room code length, expiry, reconnect, max players. Grep: no `2000/15000/600000` literals outside `shared/src/config.ts`. Server skeleton imports `GAME_DEFAULTS` and runs. `repo-guards.test.ts` enforces both. |

**Score:** 4/5 truths verified (1 uncertain, needs human device check; 0 behavior-unverified)

Plan-level must-haves also checked: D-01 found cells empty and inert (`Board.tsx` `cell--found`, disabled, reducer `value < next` no-op); D-02 clock starts at board reveal (`start` dispatched in mount effect); D-03 2-16 code points, NFC, charset allow-list; D-04 blocklist human-approved (01-04 SUMMARY, checkpoint approved); D-05 +2 s only via `GAME_DEFAULTS`; lockfile review approved (01-01 SUMMARY); no network API (grep clean, guard test); single input path (pointerdown + keyboard, no click handler).

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | Replayable tap log, strict server verification, server-issued seed (CR-01, WR-01, WR-07) | Phase 2 | SC1 server-issued seed, SC3 forged logs rejected; SOLO-02, SOLO-03. Not a Phase 1 must-have (no server in Phase 1). |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `shared/src/config.ts`, `board.ts`, `game.ts`, `time.ts`, `nickname.ts`, `nickname-blocklist.ts`, `index.ts` | ✓ VERIFIED | Substantive, exported via barrel, consumed by client and server. |
| `client/src/App.tsx`, `screens/{Menu,Game,Result}Screen.tsx`, `components/{Board,Timer}.tsx`, `lib/{storage,haptics,seed}.ts`, `i18n/vi.ts`, `styles.css`, `index.html` | ✓ VERIFIED | Wired menu -> playing -> result state machine; build succeeds. |
| `server/src/index.ts`, `server/src/repo-guards.test.ts` | ✓ VERIFIED | Skeleton runs, exits 0, opens no port; guards pass. |
| `package-lock.json`, `.node-version`, `vitest.config.ts`, `README.md` | ✓ VERIFIED | Present; three vitest projects run. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| App -> GameScreen -> Board | `<GameScreen key=seed>` -> `<Board>` | WIRED | Board gets `state.board/next/flash`, `onTap` dispatches reducer event. |
| GameScreen -> haptics | `vibrate(GAME_DEFAULTS.ui.wrongVibrateMs)` | WIRED | Triggered on `wrongCount` change. |
| MenuScreen -> nickname.ts | `validateNickname()` | WIRED | Reason code mapped to `vi.nicknameErrors`. |
| App -> storage | `loadNickname()` / `saveNickname()` | WIRED | Prefill and save on start. |
| game.ts -> board.ts / config.ts | `generateBoard`, `GAME_DEFAULTS.wrongTapPenaltyMs` | WIRED | |
| server -> shared | `GAME_DEFAULTS` import | WIRED | Verified by running it. |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Board | `state.board` | `generateBoard(seed)` from `newSeed()` (crypto-random) | Yes | FLOWING |
| Timer | elapsed | `performance.now()` - `startedAt` + penalty | Yes | FLOWING |
| ResultScreen | `finalMs`, `rawMs` | reducer state via `onFinish` | Yes | FLOWING |
| MenuScreen nickname | prefill | `localStorage` via `loadNickname` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Board is permutation 1..N | tsx script on `generateBoard('x1', 4/5/6)` | 16/25/36 unique, min 1, max N | PASS |
| Wrong tap + completion math | tsx reducer script | `next` stays 1, wrongCount 1, final 4600 | PASS |
| Nickname rules | tsx `validateNickname` script | as in truth 4 | PASS |
| Vibrate behavior | `vitest run -t vibrate` | 5 passed | PASS |
| Server skeleton | `npm run start -w @schulte/server` | prints config, exit 0 | PASS |

### Probe Execution

Step 7c: SKIPPED (no `probe-*.sh` declared or present).

### Requirements Coverage

All 10 phase IDs are claimed by PLAN frontmatter and mapped to Phase 1 in REQUIREMENTS.md; no orphans.

| Requirement | Source Plan | Status | Evidence |
|-------------|-------------|--------|----------|
| BOARD-01 | 01-02 | ✓ SATISFIED | `generateBoard` permutation for 4/5/6, golden vectors, menu size choice |
| BOARD-02 | 01-02, 01-03 | ✓ SATISFIED | Clock start/stop, final time shown; spot-check 4600 |
| BOARD-03 | 01-02, 01-03 | ✓ SATISFIED (device haptics pending UAT) | Reducer +2 s, flash, vibrate tests |
| UI-01 | 01-03, 01-05 | ? NEEDS HUMAN | CSS/markup in place; real-device sizing needs UAT |
| UI-02 | 01-03, 01-05 | ✓ SATISFIED | `vi.ts` only; source-scan and render guards pass |
| ID-01 | 01-04, 01-05 | ✓ SATISFIED | Shared `validateNickname`, used by client; server reuse deferred to Phase 2 by design |
| ID-02 | 01-04, 01-05 | ✓ SATISFIED | localStorage prefill, fault-tolerant, tested |
| SOLO-01 | 01-02, 01-05 | ✓ SATISFIED | Full local loop, no network |
| OPS-07 | 01-01, 01-05 | ✓ SATISFIED | Own toplevel, in-repo deps only, guard test |
| OPS-08 | 01-02, 01-05 | ✓ SATISFIED | `GAME_DEFAULTS` single file; guard test |

### Judgment-tier Prohibitions (non-authoritative verdict, human review recommended)

| Prohibition | Verdict | Flag |
|-------------|---------|------|
| No whole-screen flash/strobe on wrong tap (01-03) | No violation: animation only on the single `cell--wrong`, one 300 ms pulse | unverified-prohibition: human review recommended (visual, covered by UAT) |
| Do not reject common Vietnamese names (01-04) | Listed examples accepted; BUT cross-word false positives found ("Edit Me", "Bacon Cacao") | unverified-prohibition: human review recommended (see WR-02 below) |
| Do not echo rejected nickname / shaming wording (01-05) | No violation: neutral `vi.nicknameErrors.blocked`, test asserts no echo | unverified-prohibition: human review recommended |
| No data off device in Phase 1 (01-05) | No violation: grep finds no fetch/XHR/WebSocket/external URL; guard test passes | unverified-prohibition: human review recommended |

### Anti-Patterns Found

No TBD/FIXME/XXX/TODO in sources; no stubs; no hardcoded-empty render data. Code review (01-REVIEW.md) findings checked against must-haves:

| Finding | Severity | Impact on Phase 1 goal |
|---------|----------|------------------------|
| CR-01 / WR-01 / WR-07 replay contract, lenient reducer, client seed | Deferred (Phase 2) | None for local solo play; Phase 2 must address (SOLO-02/03). |
| WR-02 blocklist cross-word false positives (confirmed: "Edit Me", "Bacon Cacao" -> blocked) | WARNING | Rejects some legitimate multi-word names; does not break SC4 (profanity rejected, tested Vietnamese names accepted). |
| WR-03 homoglyph/fullwidth bypass, IN-03 separator-only names (`__`) accepted | WARNING | Filter is "basic" by decision; bypassable. |
| WR-04 right-click/non-primary pointer counts as tap; WR-05 focus loss + key repeat | WARNING | Desktop/keyboard only; touch play on phone unaffected. |
| WR-06 tautological tests in `App.test.tsx` | WARNING | Weakens a test, not a must-have. |
| IN-05 `build` does not typecheck; landscape 6x6 may overflow (`min-height: 44px` vs `100dvh - 180px`) | WARNING | Landscape phone layout is a risk; include landscape in UAT. |
| IN-01, IN-02, IN-04, IN-06 | Info | Maintainability. |

### Human Verification Required

1. **Phone UAT (01-05 D6)** - see frontmatter. Not yet performed; also try landscape on a 6x6 board (IN-05).
2. **Accept or fix WR-02 false positives** - see frontmatter.

### Gaps Summary

No failing truths and no blockers: the full solo loop (menu, nickname validation and prefill, board sizes, ordered tapping, wrong-tap penalty/flash/vibrate, result, replay), the one-file config, repo independence and the server skeleton are all present, wired, and exercised by passing tests plus verifier spot-checks. The phase is `human_needed` solely because the physical-phone UAT (touch sizing, zoom/callout/pull-to-refresh, haptics, iOS behavior) has not been performed, and because judgment-tier prohibitions need a human acknowledgment. Recommended warnings to carry into Phase 2 planning: WR-02, WR-03, WR-04, IN-05 (landscape), and the replay-contract items CR-01/WR-01/WR-07.

---

_Verified: 2026-10-28_
_Verifier: Claude (gsd-verifier)_
