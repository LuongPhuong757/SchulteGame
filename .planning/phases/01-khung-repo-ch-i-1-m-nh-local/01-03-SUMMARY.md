---
phase: 01-khung-repo-ch-i-1-m-nh-local
plan: 03
subsystem: client-ui
status: complete
tags: [react, mobile-first, touch, haptics, timer, vitest, tdd]

requires:
  - phase: 01-02
    provides: GAME_DEFAULTS, gameReducer, finalTimeMs, formatTime, vi strings, tracer App
provides:
  - Board component (touch-first grid, emptied found cells, wrong-cell flash)
  - GameScreen (reducer owner, start at reveal, derived feedback, GameResult)
  - Timer (timestamp-derived live clock including penalties)
  - vibrate() feature-detected haptics
  - styles.css mobile-first layout
affects: [01-05, phase-2]

actuals:
  tokens: 4800
  tasks: 3
  commits: 6
plan_head_before: d6bce1a99f4b164fd5cc261a0b15c548431891c7

tech-stack:
  added: []
  patterns: [pointerdown+keyboard single input path, feedback derived from reducer output, timer recomputed from timestamps, CSS variables --n and --flash-ms from config]

key-files:
  created:
    - client/src/components/Board.tsx
    - client/src/components/Board.test.tsx
    - client/src/components/Timer.tsx
    - client/src/screens/GameScreen.tsx
    - client/src/screens/GameScreen.test.tsx
    - client/src/lib/haptics.ts
    - client/src/styles.css
    - shared/src/time.test.ts
  modified:
    - client/src/App.tsx
    - client/src/main.tsx
    - client/src/i18n/vi.ts

key-decisions:
  - "Cells have no click handler; pointerdown (preventDefault) plus Enter/Space is the only input path, so one tap is one event (T-03-01)"
  - "Flash duration travels as CSS variable --flash-ms from GAME_DEFAULTS.ui.wrongFlashMs; no duration literal in CSS or components"
  - "Found cells stay in the DOM as empty disabled aria-hidden buttons so the grid layout never shifts (D-01)"
  - "Timer interval only forces re-render; value is recomputed from performance.now() and startedAt each render"

requirements-completed: [UI-01, UI-02, BOARD-02, BOARD-03]

coverage:
  - id: D1
    description: "Touch-first square board; found numbers disappear and become inert (D-01); single input path"
    requirement: UI-01
    verification:
      - kind: test
        ref: "client/src/components/Board.test.tsx"
        status: pass
      - kind: other
        ref: "grep gates: no :hover in styles.css, no onClick in Board.tsx, touch-action/100dvh/safe-area-inset present"
        status: pass
    human_judgment: true
    rationale: "Cell size at 360 px and real-touch feel are verified on a phone in Plan 01-05"
  - id: D2
    description: "Wrong tap flashes one cell red for wrongFlashMs, vibrates where supported, no throw on iOS path"
    requirement: BOARD-03
    verification:
      - kind: test
        ref: "client/src/screens/GameScreen.test.tsx#GameScreen wrong-tap feedback, vibrate()"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live timer includes +2 s per wrong tap, Tiep theo hint, final time matches result"
    requirement: BOARD-02
    verification:
      - kind: test
        ref: "client/src/screens/GameScreen.test.tsx#GameScreen next hint and live timer, finish"
        status: pass
      - kind: test
        ref: "shared/src/time.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "All new visible strings come from vi.ts"
    requirement: UI-02
    verification:
      - kind: other
        ref: "vi.game.wrongTaps/next/timeLabel used by GameScreen and Timer; no literal Vietnamese in the new components"
        status: pass
    human_judgment: false

duration: 2 min
completed: 2026-10-28
---

# Phase 1 Plan 03: Mobile game screen Summary

Touch-first Board (pointerdown and keyboard only, found cells emptied), GameScreen with red-flash plus feature-detected vibration derived from reducer output, and a timestamp-derived live Timer that already includes +2 s per wrong tap, all styled mobile-first with no hover.

## Accomplishments

- Board renders size x size buttons driven by CSS variables `--n` and `--flash-ms`; found cells become empty, disabled, `aria-hidden`; flash is confined to one cell and restarts on repeat via a re-keyed cell.
- GameScreen owns the reducer, starts the clock at reveal (D-02), derives flash/vibrate from `wrongCount` increases, and calls `onFinish(GameResult)` exactly once (ref guard).
- Timer and "Tiếp theo: N" header; final time shown in the result equals the live clock value.
- 55 tests pass (shared 28 including 9 new formatTime cases, client 27), typecheck clean, production build OK.

## Task Commits

1. Task 1 RED: 71d136e - failing Board tests
2. Task 1 GREEN: 6657862 - Board, styles.css, App wiring
3. Task 2 RED: 3ac7212 - failing GameScreen/vibrate tests
4. Task 2 GREEN: 298f9d6 - GameScreen, haptics, vi.game.wrongTaps
5. Task 3 RED: ca0622e - formatTime tests and failing next/timer tests
6. Task 3 GREEN: 59ec57c - Timer and next hint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RTL auto-cleanup not active under vitest without globals**
- **Found during:** Task 1 GREEN (multiple elements with the same role and name)
- **Issue:** Rendered boards accumulated across tests in one file because `@testing-library/react` only auto-cleans when `afterEach` is a global.
- **Fix:** Explicit `cleanup()` in `afterEach` in Board and GameScreen tests.
- **Files modified:** client/src/components/Board.test.tsx, client/src/screens/GameScreen.test.tsx
- **Commit:** 6657862 (Board), 3ac7212 (GameScreen)

**Note (not a deviation):** the formatTime tests in `shared/src/time.test.ts` passed on first run because `formatTime` already existed from Plan 01-02; the RED half of Task 3 is the failing next-hint/timer client tests.

**Total deviations:** 1 auto-fixed (1 blocking). **Impact:** none on scope.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None. T-03-01 (single input path, grep gate) and T-03-02 (vibrate feature-detected with try/catch, absent path tested) mitigated.

## Issues Encountered

None. Layout half of UI-01 (cell size at 360 px, real touch feel, vibration on Android) still needs a physical-phone check in Plan 01-05.

## Next Phase Readiness

Ready for Plan 01-04 (nickname, untouched here) and 01-05. `Board`, `GameScreen`/`GameResult`, `vibrate` match the plan's interface contracts. App currently shows the result as inline text under the board; a proper result screen is for a later plan.

## Self-Check: PASSED

- All 8 created and 3 modified key files exist; commits 71d136e, 6657862, 3ac7212, 298f9d6, ca0622e, 59ec57c present.
- `npm test` 55 passed, `npm run typecheck` 0 errors, `npm run build` OK; acceptance greps pass (no `:hover`, no `onClick` in Board.tsx, touch-action/100dvh/safe-area-inset/-webkit-touch-callout/aspect-ratio present, Timer uses `GAME_DEFAULTS.ui.timerTickMs` and `performance.now()`).
