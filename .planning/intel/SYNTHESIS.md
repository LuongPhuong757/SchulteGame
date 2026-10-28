# Synthesis Summary

Mode: new. Precedence: ADR > SPEC > PRD > DOC.

## Doc counts
- Total: 1 (SPEC: 1, ADR: 0, PRD: 0, DOC: 0, UNKNOWN: 0)
- Source: /Users/m1macbook/Desktop/SchulteGame/SPEC.md (SPEC, high confidence, manifest override, not locked)

## Decisions locked
- 0 (no ADRs). See /Users/m1macbook/Desktop/SchulteGame/.planning/intel/decisions.md

## Requirements
- 0 (no PRDs). See /Users/m1macbook/Desktop/SchulteGame/.planning/intel/requirements.md

## Constraints
- 18 total, all from SPEC.md. See /Users/m1macbook/Desktop/SchulteGame/.planning/intel/constraints.md
- By type: protocol 8, nfr 7, schema 2, api-contract 1
- Areas: board and scoring rules, mobile-first UI, solo / time race / number grab modes, room lifecycle, disconnect and rejoin, identity, anti-cheat (room and solo), rate limiting, repo and packaging, SQLite, container limits, POS isolation, Caddy and DNS, kill switch, tunable defaults

## Context topics
- 0 (no DOCs). See /Users/m1macbook/Desktop/SchulteGame/.planning/intel/context.md

## Conflicts
- 0 blockers, 0 competing variants, 0 auto-resolved
- Cycle detection: no cross_refs, no cycles
- Report: /Users/m1macbook/Desktop/SchulteGame/.planning/INGEST-CONFLICTS.md

## Notes for roadmapper
- The source suggests a build order (SPEC §7), non-binding: 1) repo skeleton + solo mode local (no server), 2) server + SQLite + validated score submit + leaderboard, 3) rooms + time race (same/separate board), 4) number grab, 5) rejoin + rate limiting, 6) Docker + Caddy + VPS deploy.
- Gaps (absent in source): rate-limit thresholds, SQLite table schema, nickname filter specifics, explicit acceptance criteria (no PRD).
