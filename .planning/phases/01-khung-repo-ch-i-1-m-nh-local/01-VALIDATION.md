---
phase: "1"
slug: "khung-repo-ch-i-1-m-nh-local"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-28"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 5.0.5 (+ jsdom 30.1.3, @testing-library/react 16.3.3), Node 24.20.0 |
| **Config file** | none — Wave 0 installs `vitest.config.ts` (root, `test.projects`: shared=node, client=jsdom) |
| **Quick run command** | `npx vitest run --project shared` |
| **Full suite command** | `npm test && npm run typecheck && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project shared` (or the touched project)
- **After every plan wave:** Run `npm test && npm run typecheck && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + manual phone UAT
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

Filled in by the planner per task. Requirement → test map from RESEARCH.md:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| BOARD-01 | Permutation 1..N for 4/5/6; deterministic by seed; golden vectors | unit | `npx vitest run --project shared board` | ❌ W0 | ⬜ pending |
| BOARD-02 | Correct sequence finishes; time = finishedAt-startedAt (+penalties) | unit | `npx vitest run --project shared game` | ❌ W0 | ⬜ pending |
| BOARD-03 | Wrong tap: +penalty, red flash class, vibrate when present, no throw when absent | unit + component | `npx vitest run game GameScreen` | ❌ W0 | ⬜ pending |
| UI-01 | N² buttons, pointerdown, no `:hover` CSS | component + manual | `npx vitest run --project client Board` | ❌ W0 | ⬜ pending |
| UI-02 | All visible strings from `vi.ts` | component | `npx vitest run --project client i18n` | ❌ W0 | ⬜ pending |
| ID-01 | Nickname length/charset/blocklist/NFD/leet | unit | `npx vitest run --project shared nickname` | ❌ W0 | ⬜ pending |
| ID-02 | Save/prefill nickname; tolerate throwing storage; drop invalid stored | component | `npx vitest run --project client nickname` | ❌ W0 | ⬜ pending |
| SOLO-01 | Menu → size → play → result, no network | component (flow) | `npx vitest run --project client App` | ❌ W0 | ⬜ pending |
| OPS-07 | Repo root is its own git repo | smoke | `test "$(git rev-parse --show-toplevel)" = "$PWD"` | n/a | ⬜ pending |
| OPS-08 | Six SPEC defaults in `GAME_DEFAULTS`; no stray literals | unit + grep | `npx vitest run --project shared config` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts`, `tsconfig.base.json`, per-package `tsconfig.json`, root `package.json` scripts
- [ ] `shared/src/{board,game,nickname,config,time}.test.ts`
- [ ] `client/src/**/*.test.tsx` (Board, GameScreen, Menu/nickname, App flow, i18n)
- [ ] Framework install: `npm install` under Node 24.20.0 (`.node-version`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cells tappable at 360px, no zoom/select/scroll glitches | UI-01 | jsdom has no layout | `npm run dev -- --host`, open on Android Chrome + iPhone Safari, play 4×4/5×5/6×6 |
| Wrong tap flashes red, vibrates on Android | BOARD-03 | jsdom has no haptics | Tap a wrong number on both phones |
| Final time = elapsed + 2s per wrong tap; nickname prefilled after reload | BOARD-02, ID-02 | End-to-end feel on device | Finish a game with 1–2 wrong taps, reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
