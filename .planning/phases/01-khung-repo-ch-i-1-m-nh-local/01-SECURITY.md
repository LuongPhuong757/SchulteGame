---
phase: "1"
slug: "khung-repo-ch-i-1-m-nh-local"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-28"
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → repo | Third-party packages installed from the approved lockfile | Package code (supply chain) |
| User input → client | Nickname typed by the player | Untrusted string (rendered on screen, stored on device) |
| localStorage → client | Stored nickname read back on load | Untrusted string (may be edited) |
| Dev server → LAN | `dev:phone` exposes Vite on the local network for phone testing | Static client bundle, no secrets |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | npm installs | high | mitigate | Exact pins (no ^/~ ranges), lockfile resolved with `--package-lock-only --ignore-scripts`, user approved lockfile at 01-01 checkpoint, installs via `npm ci` | closed |
| T-01-02 | Tampering | `@schulte/shared` dependency confusion | medium | mitigate | Lockfile entry `link: true`, `resolved: "shared"`; workspaces `private: true` | closed |
| T-01-03 | Elevation of Privilege | esbuild postinstall | low | mitigate | `--ignore-scripts` at resolution; install scripts not approved | closed |
| T-01-04 | Information Disclosure | Vite dev server on LAN | low | mitigate | `dev` binds localhost; LAN only via explicit `dev:phone` | closed |
| T-01-05 | Information Disclosure | Committed artifacts | low | accept | No secrets/env files in Phase 1; `.gitignore` covers build output | closed |
| T-02-01 | Tampering | Client-side timer / tap log | low | accept | Phase 1 records nothing server-side; Phase 2 server replay (`replay`/`replayStrict` added in code-review fix) is the control | closed |
| T-02-02 | Spoofing | Board seed predictability | low | mitigate | `newSeed` uses `crypto.getRandomValues` (client/src/lib/seed.ts:3); no `Math.random` in production code | closed |
| T-02-03 | Tampering | Runtime mutation of GAME_DEFAULTS | low | mitigate | Deep freeze in shared/src/config.ts + isFrozen tests | closed |
| T-02-04 | Denial of Service | Reducer fed hostile events | low | mitigate | Finite/backwards-t and range guards in shared/src/game.ts; strict replay rejects in `replayStrict` | closed |
| T-03-01 | Tampering | Duplicate pointer+click dispatch | low | mitigate | Board uses `onPointerDown` only, no `onClick`; non-primary buttons ignored (WR-04 fix) | closed |
| T-03-02 | Denial of Service | Vibration API missing/throwing | low | mitigate | Feature-detect + try/catch in client/src/lib/haptics.ts; absent path tested | closed |
| T-03-03 | Tampering | Board content rendering | low | accept | Integers only, React text rendering | closed |
| T-04-01 | Tampering | Nickname XSS | medium | mitigate | Allow-list `^[\p{L}\p{N} _.\-]+$` (shared/src/nickname.ts:18); no `innerHTML`/`dangerouslySetInnerHTML` in client | closed |
| T-04-02 | Spoofing | Bidi override / zero-width / control / mark stacks | medium | mitigate | Allow-list excludes `\p{C}`,`\p{M}`; tests reject U+202E, U+200D, U+200B, U+0000, stacked marks (verified by run) | closed |
| T-04-03 | Spoofing | Homoglyphs | low | accept | `\p{L}` intentionally broad for Vietnamese; blocklist now folds confusables (WR-03 fix); revisit for Phase 2 leaderboard uniqueness | closed |
| T-04-04 | Denial of Service | Huge input / regex backtracking | low | mitigate | `maxInputLength` cap before normalization; linear single-class regexes | closed |
| T-04-05 | Tampering | Edited localStorage nickname | low | mitigate | `validateNickname` on load and save in client/src/lib/storage.ts | closed |
| T-05-01 | Information Disclosure | Data leaving device | low | mitigate | No fetch/XHR/WebSocket/sendBeacon in client/shared sources; repo guard + fetch spy test; UAT test 3 passed | closed |
| T-05-02 | Tampering | XSS on result/menu screens | medium | mitigate | Allow-list + React text rendering + repo guard forbidding raw-HTML APIs | closed |
| T-05-03 | Information Disclosure | Server skeleton exposing a port | low | mitigate | server/src/index.ts has no `listen`/`createServer` | closed |
| T-05-04 | Tampering | Default literals drifting out of config | low | mitigate | OPS-08 guard in server/src/repo-guards.test.ts | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-05 | No secrets exist in Phase 1 | plan 01-01 threat model | 2026-10-28 |
| AR-02 | T-02-01 | Local-only phase; server replay control arrives in Phase 2 | plan 01-02 threat model | 2026-10-28 |
| AR-03 | T-03-03 | Integer-only content, auto-escaped | plan 01-03 threat model | 2026-10-28 |
| AR-04 | T-04-03 | Broad letter class required for Vietnamese names | plan 01-04 threat model | 2026-10-28 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-28 | 21 | 21 | 0 | /gsd-secure-phase (L1 grep + run checks, orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-28
