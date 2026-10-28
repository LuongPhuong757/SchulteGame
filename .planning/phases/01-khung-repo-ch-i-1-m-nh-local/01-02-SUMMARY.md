---
phase: 01-khung-repo-ch-i-1-m-nh-local
plan: 02
subsystem: game-core
status: complete
tags: [shared-core, seeded-board, game-reducer, react, vitest, tdd]

requires:
  - phase: 01-01
    provides: npm workspaces, pinned toolchain, approved lockfile
provides:
  - GAME_DEFAULTS deep-frozen single config (OPS-08)
  - generateBoard seeded deterministic board with pinned golden vectors for 4/5/6
  - Pure gameReducer with injected time, wrong-tap penalty, D-01 no-op, tap guards
  - formatTime Vietnamese decimal-comma formatting
  - React tracer flow start -> 4x4 board -> result, plus jsdom flow test
affects: [01-03, 01-04, 01-05, phase-2]

actuals:
  tokens: 14000
  tasks: 2
  commits: 3
plan_head_before: fecc0c8b4b675eff872d0e0da1a2355e1513a498

tech-stack:
  added: []
  patterns: [pure reducer with injected event.t, FNV-1a + mulberry32 + Fisher-Yates, barrel-only import of @schulte/shared, central vi strings]

key-files:
  created:
    - shared/src/config.ts
    - shared/src/board.ts
    - shared/src/game.ts
    - shared/src/time.ts
    - shared/src/index.ts
    - shared/src/config.test.ts
    - shared/src/board.test.ts
    - shared/src/game.test.ts
    - client/src/main.tsx
    - client/src/App.tsx
    - client/src/App.test.tsx
    - client/src/lib/seed.ts
    - client/src/i18n/vi.ts
    - server/src/index.ts
  modified: []

key-decisions:
  - "generateBoard('abc', 6) pinned as third golden vector, captured from the implementation after the 4 and 5 vectors passed"
  - "Reducer evaluation order: status playing, finite and non-backwards t, integer value in 1..total, then value < next no-op (D-01), correct, wrong"
  - "Penalty arithmetic lives only in finalTimeMs (single source)"

requirements-completed: [SOLO-01, BOARD-01, BOARD-02, BOARD-03, OPS-08]

coverage:
  - id: D1
    description: "Tracer: start -> 4x4 board -> tap 1..16 -> result title and 'giay' text, no network"
    requirement: SOLO-01
    verification:
      - kind: test
        ref: "client/src/App.test.tsx#App tracer flow"
        status: pass
      - kind: other
        ref: "npm run build -> client/dist/index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "Seeded board is a permutation, deterministic, golden-pinned for 4/5/6, RangeError outside 4/5/6"
    requirement: BOARD-01
    verification:
      - kind: test
        ref: "shared/src/board.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Clock start at start event, final time = raw + wrongCount x penalty, guards keep final time non-negative"
    requirement: BOARD-02
    verification:
      - kind: test
        ref: "shared/src/game.test.ts#finishing (BOARD-02), guards (T-02-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Wrong tap +1 wrong count, next unchanged, logged; found-number tap returns identical state (D-01); k wrong taps add k x penalty"
    requirement: BOARD-03
    verification:
      - kind: test
        ref: "shared/src/game.test.ts#wrong taps (BOARD-03, D-05), found numbers (D-01)"
        status: pass
    human_judgment: false
  - id: D5
    description: "SPEC defaults only in shared/src/config.ts and deep-frozen"
    requirement: OPS-08
    verification:
      - kind: test
        ref: "shared/src/config.test.ts"
        status: pass
      - kind: other
        ref: "grep for 2000/15000/600000 literals and Date.now/Math.random outside tests and config.ts prints nothing"
        status: pass
    human_judgment: false

duration: 2 min
completed: 2026-10-28
---

# Phase 1 Plan 02: Shared game core and tracer flow Summary

Seeded deterministic board (FNV-1a, mulberry32, Fisher-Yates, golden-pinned for 4/5/6), a pure game reducer with injected time, wrong-tap penalty and D-01 no-op, a deep-frozen GAME_DEFAULTS, and a React start -> board -> result flow proven by a jsdom test, typecheck and production build.

## Accomplishments

- Tracer first: `npm ci` from the approved lockfile (lockfile unchanged), shared core, React App, flow test, typecheck and build all green in one commit.
- Test-driven rules: 25 shared tests (config, board, game) cover golden vectors, permutation over 200 seeds per size, penalty, D-01 identity, guards and immutability.
- OPS-08: the six SPEC defaults exist only in `shared/src/config.ts`, deep-frozen; purity and stray-literal greps are clean.

## Task Commits

1. Task 1 (tracer): fe4646d - feat(01-02) end-to-end 4x4 game
2. Task 2 RED: f56203f - test(01-02) failing tests (5 failed against tracer reducer)
3. Task 2 GREEN: 64dfdb1 - feat(01-02) wrong-tap penalty and tap guards

No refactor commit needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] server workspace typecheck had no inputs**
- **Found during:** Task 1 verify (`npm run typecheck`)
- **Issue:** `server/tsconfig.json` includes `src` but the folder did not exist, so tsc failed with TS18003 and the plan criterion "typecheck passes for shared, client and server" could not be met.
- **Fix:** Added placeholder `server/src/index.ts` (`export {};`). Plan 01-05 owns and will replace this file with the real skeleton.
- **Files modified:** server/src/index.ts
- **Commit:** fe4646d

**Total deviations:** 1 auto-fixed (1 blocking). **Impact:** none on scope; 01-05 overwrites the placeholder.

## Auth Gates

None.

## Known Stubs

`server/src/index.ts` is an intentional empty placeholder, resolved by Plan 01-05. No UI stubs.

## Threat Flags

None. T-02-02/03/04 mitigations implemented (crypto seed, deep freeze, reducer guards).

## Issues Encountered

`npm ci` warns that esbuild and fsevents have install scripts not covered by allowScripts; scripts were not approved or run, and build/tests work without them.

## Next Phase Readiness

Ready for Plan 01-03. Contracts (`GAME_DEFAULTS`, `generateBoard`, `gameReducer`, `formatTime`, `vi`, `newSeed`) match the plan interfaces exactly.

## Self-Check: PASSED

- All 14 key files exist on disk; commits fe4646d, f56203f, 64dfdb1 present in git log.
- Verification: `npm test` 26 passed (shared 25, client 1), typecheck clean for 3 workspaces, build produced client/dist/index.html, package-lock.json unchanged.
