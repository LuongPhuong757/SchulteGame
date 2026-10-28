---
phase: 01-khung-repo-ch-i-1-m-nh-local
plan: 05
subsystem: ui
status: complete
tags: [react, menu, nickname, result-screen, server-skeleton, repo-guards, i18n, vitest, tdd]

requires:
  - phase: 01-03
    provides: GameScreen, Board, Timer, vi.ts, styles, seed
  - phase: 01-04
    provides: validateNickname, loadNickname / saveNickname
provides:
  - MenuScreen (nickname + 4x4/5x5/6x6 choice, Vietnamese inline errors)
  - ResultScreen (final time, raw + penalty breakdown, replay / change size)
  - App state machine menu -> playing -> result with nickname and size memory
  - Server skeleton importing GAME_DEFAULTS from @schulte/shared (no port)
  - Permanent guards for OPS-07, OPS-08, privacy, raw HTML, UI-01, UI-02
  - Vietnamese README (Node 24 via fnm, phone testing, config location)
affects: [phase-2]

actuals:
  tokens: 8500
  tasks: 3
  commits: 5
plan_head_before: 9dd552210fdd562d5ff09f5e8fbfe112c1770903

tech-stack:
  added: []
  patterns: [screen state machine keyed GameScreen per seed, reason code -> vi.ts text mapping with Record<NicknameError,string>, repo guard tests scanning sources with file:line reports, import.meta.glob ?raw source scan for UI-02]

key-files:
  created:
    - client/src/screens/MenuScreen.tsx
    - client/src/screens/MenuScreen.test.tsx
    - client/src/screens/ResultScreen.tsx
    - client/src/i18n/vi.test.tsx
    - server/src/repo-guards.test.ts
    - README.md
  modified:
    - client/src/App.tsx
    - client/src/App.test.tsx
    - client/src/i18n/vi.ts
    - client/src/styles.css
    - server/src/index.ts
    - vitest.config.ts

key-decisions:
  - "vi.nicknameErrors is a Record<NicknameError,string> with min/max interpolated from GAME_DEFAULTS.nickname, so a new reason code fails typecheck and no 2/16 literals exist"
  - "Replay always calls newSeed() and keeps the size; change size returns to the menu with nickname and size as initial values"
  - "UI-02 source scan also rejects combining marks (U+0300-036F) so NFD Vietnamese literals cannot slip into screens"
  - "Server skeleton only logs the shared config and exits; no HTTP/socket dependency (T-05-03)"

requirements-completed: [SOLO-01, ID-01, ID-02, UI-01, UI-02, OPS-07, OPS-08]

coverage:
  - id: D1
    description: "Vietnamese menu: nickname prefill (ID-02), validation alerts per reason code without echoing input (ID-01), size toggle and submit of the normalized nickname"
    requirement: ID-01
    verification:
      - kind: test
        ref: "client/src/screens/MenuScreen.test.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full solo loop menu -> play (wrong tap) -> result -> replay with fresh seed -> change size -> reload prefill, fetch never called"
    requirement: SOLO-01
    verification:
      - kind: test
        ref: "client/src/App.test.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Server skeleton starts under tsx, prints shared GAME_DEFAULTS and exits 0 without a port"
    requirement: OPS-07
    verification:
      - kind: command
        ref: "npm run start -w @schulte/server | grep wrongTapPenaltyMs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Repo guards: SPEC literals only in config.ts, exact in-repo dependency specs, no network API, no raw HTML, no hover CSS"
    requirement: OPS-08
    verification:
      - kind: test
        ref: "server/src/repo-guards.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "UI-02: no Vietnamese-letter literal in App/screens/components sources, no English UI word on any rendered screen, all vi leaves non-empty"
    requirement: UI-02
    verification:
      - kind: test
        ref: "client/src/i18n/vi.test.tsx"
        status: pass
    human_judgment: false
  - id: D6
    description: "Real-phone feel: 6x6 cell tap size at 360 px, no zoom / selection / pull-to-refresh, haptics on Android, result time matches live timer"
    requirement: UI-01
    verification: []
    human_judgment: true
    rationale: "jsdom has no layout, touch physics or haptics; collected as end-of-phase phone UAT (human-check below)"

duration: 5 min
completed: 2026-10-28
---

# Phase 1 Plan 05: Menu, result screen, server skeleton and guards Summary

Vietnamese menu (validated, remembered nickname + 4x4/5x5/6x6) and result screen with replay on a fresh seed complete the local solo loop, plus a server skeleton consuming `@schulte/shared` and permanent guard tests for OPS-07 / OPS-08 / privacy / raw HTML / UI-01 / UI-02.

## Accomplishments

- `MenuScreen`: `<form noValidate>`, 18px nickname input (no iOS zoom), 48px size buttons with `aria-pressed`, `role="alert"` message chosen only by reason code (never echoes input or matched word). Editing clears the error.
- `App` state machine menu -> playing -> result; `GameScreen` keyed by seed; nickname loaded lazily from storage and saved on start (false return ignored); replay uses `newSeed()` and the same size.
- `ResultScreen`: greeting, final time (`formatTime(finalMs)` + giây), raw + `n lần chạm sai × 2 giây` breakdown from the same `GameResult` numbers as the live timer, replay and change-size buttons.
- Server workspace prints `[schulte-server] skeleton OK - shared config: {...}` under tsx and exits 0; no port, no new dependency.
- Vitest now runs three projects; 183 tests pass. Guards were mutation-checked: a temporary file with `2_000`, `fetch(` and `innerHTML` made three guards fail with file:line output, then was removed.
- README (Vietnamese) covers fnm / Node 24.20.0, `npm ci`, scripts, `dev:phone`, layout, `shared/src/config.ts`, Pitfall 8 note and Phase 2 open decisions.

## Task Commits

1. Task 1 RED: 36dc68f - failing menu tests
2. Task 1 GREEN: 4ace983 - MenuScreen, App state machine, vi strings, styles
3. Task 2 RED: cd7d043 - failing full solo flow test
4. Task 2 GREEN: d76cb16 - ResultScreen, replay / change size wiring
5. Task 3: d9bac84 - server skeleton, server vitest project, repo guards, vi.test.tsx, README

## Deviations from Plan

None - plan executed exactly as written. Notes: the plan text shows HTML-escaped `a&lt;b`; the test uses the literal `a<b` with the same `bad_chars` verdict. The Task 1 commit also updated the existing App tracer test to type a nickname first (the Start button now lives in the menu); Task 2 then replaced it as planned.

**Total deviations:** 0.

## Auth Gates

None.

## Known Stubs

None. (`placeholder` is the nickname input hint text sourced from `vi.menu.nicknameHint`, not a stub.)

## Threat Flags

None. T-05-01 (no network code guard, fetch spy, index.html without URLs), T-05-02 (allow-list + React text + raw-HTML guard), T-05-03 (no listener, no HTTP/socket dependency), T-05-04 (OPS-08 guard, README note) mitigated.

## Human Checks (collected at end of phase)

Phone UAT, not run by the executor (needs physical devices). Run `fnm exec --using=24.20.0 -- npm run dev:phone`; on an Android phone (Chrome) and an iPhone (Safari) on the same Wi-Fi open the printed Network URL. Enter a nickname, play 4x4, 5x5 and 6x6, tap 1-2 wrong numbers once, reload.

Expected: at ~360 px width every 6x6 cell is comfortably tappable (about 44 px or larger), no double-tap zoom, no text selection or callout on long-press, no pull-to-refresh during play, focusing the nickname input does not zoom; a wrong tap flashes only that cell red and vibrates on Android (iPhone: flash only); found numbers disappear; result time equals elapsed + 2 s per wrong tap and matches the live timer; after reload the nickname is prefilled; all text is Vietnamese.

## Issues Encountered

None.

## Next Phase Readiness

Phase 1 plans are complete; the phone UAT human-check remains for the verifier. Phase 2 inherits the open decisions listed in `server/src/index.ts` and README (server production build, SQLite driver, effective-config endpoint).

## Self-Check: PASSED

- Files exist: MenuScreen.tsx, MenuScreen.test.tsx, ResultScreen.tsx, vi.test.tsx, repo-guards.test.ts, README.md, server/src/index.ts, vitest.config.ts.
- Commits 36dc68f, 4ace983, cd7d043, d76cb16, d9bac84 present; `git rev-list --count 9dd5522..HEAD` = 5.
- `npm test` 183 passed across shared, client, server; `npm run typecheck` 0 errors; `npm run build` ok; `npm run start -w @schulte/server` prints wrongTapPenaltyMs; git toplevel equals repo dir; README contains fnm, npm ci, dev:phone, shared/src/config.ts; server/package.json has no HTTP/socket/SQLite dependency.
