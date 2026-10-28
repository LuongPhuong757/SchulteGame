---
phase: 01-khung-repo-ch-i-1-m-nh-local
plan: 04
subsystem: identity
status: complete
tags: [nickname, validation, unicode, blocklist, localStorage, vitest, tdd]

requires:
  - phase: 01-02
    provides: GAME_DEFAULTS.nickname limits, shared barrel, vitest projects
provides:
  - validateNickname / foldNickname / isBlockedNickname shared pure filter (reason codes only)
  - Human-approved Vietnamese + English blocklist (three lists)
  - loadNickname / saveNickname fault-tolerant localStorage persistence
affects: [01-05, phase-2]

actuals:
  tokens: 9500
  tasks: 3
  commits: 4
plan_head_before: 7ba89c175db2486992ebabda7c0a99ab3b7a7bd6

tech-stack:
  added: []
  patterns: [one shared validator for client and future server, reason codes not display text, accented-only matching for words whose folded form collides with innocent names, re-validate on storage read]

key-files:
  created:
    - shared/src/nickname.ts
    - shared/src/nickname-blocklist.ts
    - shared/src/nickname.test.ts
    - client/src/lib/storage.ts
    - client/src/lib/storage.test.ts
  modified:
    - shared/src/index.ts

key-decisions:
  - "Blocklist uses three tiers: accented whole tokens (collision-prone words), folded whole tokens with digit leet map, folded 5-8 letter substrings; conservative on purpose, false negatives preferred over blocking real names"
  - "dm kept in the folded teencode list despite possible initials collision (user approved at D-04 checkpoint)"
  - "Names made only of allowed punctuation (e.g. '...') are accepted because D-03 lists charset without requiring a letter"
  - "Blocklist module is not re-exported from the shared barrel"

requirements-completed: [ID-01, ID-02]

coverage:
  - id: D1
    description: "Shared validator enforces D-03 (NFC, 2-16 code points, allow-list charset) with reason codes, identical for NFC/NFD, rejecting emoji, bidi, zero-width, control, stacked marks, non-strings and oversized raw input"
    requirement: ID-01
    verification:
      - kind: test
        ref: "shared/src/nickname.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Blocklist enforced for accented, folded, leet and separator variants without blocking 20 common Vietnamese names and words"
    requirement: ID-01
    verification:
      - kind: test
        ref: "shared/src/nickname.test.ts#blocklist enforcement, blocklist hygiene, must-accept fixtures"
        status: pass
    human_judgment: true
    rationale: "List content is a policy decision; the user reviewed and approved it at the blocking D-04 checkpoint"
  - id: D3
    description: "Nickname persisted on valid save, read back, tampered values dropped, throwing storage never throws"
    requirement: ID-02
    verification:
      - kind: test
        ref: "client/src/lib/storage.test.ts"
        status: pass
    human_judgment: false

duration: 8 min
completed: 2026-10-28
---

# Phase 1 Plan 04: Nickname filter and storage Summary

One shared pure nickname validator (NFC, 2-16 code points, Unicode allow-list, three-tier diacritic-aware blocklist approved by the user) plus fault-tolerant on-device nickname persistence that re-validates on every read.

## Accomplishments

- `validateNickname` returns `too_short`, `too_long`, `bad_chars` or `blocked` in that order, with an NFC `value` on success; limits come only from `GAME_DEFAULTS.nickname`, and raw input over `maxInputLength` is rejected before normalization.
- Blocklist tested table-driven over all three lists (as-is, uppercase, NFD, inside text, digit substitution, dotted); 20 must-accept names (Long, Đạt, Lớn, Các Bạn, Buổi Sáng, Scunthorpe, ...) pass in NFC, NFD and uppercase.
- `loadNickname` / `saveNickname` never throw (getItem, setItem and removeItem failures covered); only the validated value is stored; invalid stored values are removed.
- 158 tests pass (shared 92 nickname tests included, client storage 11), typecheck clean.

## Task Commits

1. Task 1 RED: 6c9fb8f - failing nickname tests
2. Task 1 GREEN: 1802f58 - validator, drafted blocklist, barrel export
3. Task 2 RED: 64a64ba - failing storage tests
4. Task 2 GREEN: b201c19 - storage implementation
5. Task 3: checkpoint approved by the user, no list edits ("approved", `dm` kept)

## Deviations from Plan

None - plan executed exactly as written. Note: the plan text shows HTML-escaped `&lt;script&gt;`; tests use the literal `<script>` with the same `bad_chars` verdict.

**Total deviations:** 0.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None. T-04-01, T-04-02, T-04-04, T-04-05 mitigated (allow-list, no `\p{M}`/`\p{C}`, raw length cap, linear single-class regexes, re-validation on load); T-04-03 (homoglyphs) accepted per plan.

## Issues Encountered

None. Typing ambiguous words without diacritics (e.g. "du") is deliberately not blocked; compact forms like "ditme" and teencode like "dm" are.

## Next Phase Readiness

Ready for Plan 01-05: the menu can call `validateNickname`, map reason codes to `vi.ts` text (neutral message for `blocked`), and use `loadNickname`/`saveNickname`.

## Self-Check: PASSED

- Files exist: shared/src/nickname.ts, shared/src/nickname-blocklist.ts, shared/src/nickname.test.ts, client/src/lib/storage.ts, client/src/lib/storage.test.ts.
- Commits 6c9fb8f, 1802f58, 64a64ba, b201c19 present; `git rev-list --count 7ba89c1..HEAD` = 4.
- `npm test` 158 passed, `npm run typecheck` 0 errors; acceptance greps pass.
