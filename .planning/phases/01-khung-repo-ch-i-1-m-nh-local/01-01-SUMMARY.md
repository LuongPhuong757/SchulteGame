---
phase: 01-khung-repo-ch-i-1-m-nh-local
plan: 01
subsystem: infra
status: complete
tags: [npm-workspaces, node-24, vite, vitest, typescript, react]

requires: []
provides:
  - Node 24.20.0 pin (.node-version, engines >=22.12)
  - npm workspaces skeleton shared / client / server with exact dependency pins
  - Human-approved package-lock.json (resolved with --package-lock-only --ignore-scripts)
  - TypeScript, Vitest projects and Vite configuration, Vietnamese mobile index.html
affects: [01-02, 01-03, 01-04, 01-05, phase-2]

actuals:
  tokens: 12000
  tasks: 3
  commits: 2
plan_head_before: 7f35f6213098d39eba2346f2de7127d01ca211c2

tech-stack:
  added: [react 19.3.1, vite 8.3.5, vitest 5.0.5, typescript 7.0.2, jsdom 30.1.3, tsx 4.23.15, testing-library]
  patterns: [shared pure TS package consumed as raw src, exact pins, lockfile review gate before install]

key-files:
  created:
    - package.json
    - .node-version
    - .gitignore
    - .editorconfig
    - shared/package.json
    - client/package.json
    - server/package.json
    - package-lock.json
    - tsconfig.base.json
    - shared/tsconfig.json
    - client/tsconfig.json
    - server/tsconfig.json
    - vitest.config.ts
    - client/vite.config.ts
    - client/index.html
  modified: []

key-decisions:
  - "Commits made on branch gsd/phase-1-khung-repo because main is a protected branch for the executor (user confirmed staying on this branch, config untouched)"
  - "Lockfile resolved with --package-lock-only --ignore-scripts so no package code ran before human approval"

requirements-completed: [OPS-07]

coverage:
  - id: D1
    description: "Repo is its own git work tree; workspaces reference only in-repo folders"
    requirement: OPS-07
    verification:
      - kind: other
        ref: 'test "$(git rev-parse --show-toplevel)" = "$PWD"'
        status: pass
    human_judgment: false
  - id: D2
    description: "Exact pinned lockfile with @schulte/shared linked locally, approved by a human before install"
    verification:
      - kind: other
        ref: "Task 1 lockfile node check (13 versions match, shared link:true)"
        status: pass
    human_judgment: false
  - id: D3
    description: "TypeScript/Vitest/Vite config and Vietnamese mobile index.html"
    verification:
      - kind: other
        ref: "Task 2 structural check (tsconfig JSON parse, greps)"
        status: pass
    human_judgment: false

duration: 2 min
completed: 2026-10-28
---

# Phase 1 Plan 01: Repo skeleton and toolchain pin Summary

npm-workspaces skeleton (shared/client/server) on pinned Node 24.20.0 with exact dependency pins, an install-free human-approved package-lock.json, and strict TypeScript/Vitest/Vite configuration.

## Accomplishments

- Pinned Node 24.20.0 and wrote root + three workspace manifests; every dependency spec is exact except the `@schulte/shared` workspace spec `*`.
- Resolved `package-lock.json` (lockfileVersion 3, 171 node_modules entries) with `--package-lock-only --ignore-scripts`; all 13 pinned versions match and `@schulte/shared` is `link: true`.
- Added strict tsconfigs (shared has `types: []`, no DOM/Node), Vitest `projects` (shared node, client jsdom), Vite React config with no host setting, and a `lang="vi"` mobile `index.html`.
- Human approved the lockfile and the 7 recency-flagged packages; no `node_modules/` existed at approval.

## Task Commits

1. Task 1: pin Node 24, manifests, lockfile - a795ad2
2. Task 2: TS/Vitest/Vite config and index.html - 37b109f
3. Task 3: blocking-human lockfile review - approved by user, no code change

## Deviations from Plan

None to plan content. Process note: commits are on branch `gsd/phase-1-khung-repo` (not `main`) because the executor pre-commit assertion treats `main` as protected; user confirmed this choice. One comment in `client/vite.config.ts` was reworded to satisfy the "no host setting" criterion.

## Auth Gates

None.

## Known Stubs

None. (`client/src/main.tsx` referenced by index.html is created by Plan 01-02.)

## Threat Flags

None.

## Next Phase Readiness

Ready for Plan 01-02: `npm ci` is now allowed from the approved lockfile; tracer leads the code path.

## Self-Check: PASSED

- All 15 key files exist on disk; commits a795ad2 and 37b109f found in git log.
- Plan verification: Node v24.20.0, toplevel equals repo dir, 13 lockfile versions match, no node_modules.
