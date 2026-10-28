# Phase 1 — Context (user decisions, 2026-10-28)

Captured during /gsd-plan-phase 1 after research Open Questions (no full discuss-phase run).

<decisions>
- **D-01:** Found numbers disappear. — When a number is tapped correctly, its cell becomes empty (number hidden, cell disabled/inert). Tapping an emptied cell is a no-op: no penalty, no log entry needed for scoring. There is no "re-tap a found number" case. (Resolves research A3.)
- **D-02:** Clock start. — The clock starts at the moment the board is revealed after the player presses "Bắt đầu". No countdown in solo mode. (Resolves A1.)
- **D-03:** Nickname rule. — 2–16 Unicode code points after NFC normalization; allowed: letters (incl. Vietnamese diacritics), digits, space, `_` `.` `-`. (Resolves A2.)
- **D-04:** Profanity blocklist. — Claude drafts a basic Vietnamese + English blocklist (diacritic-folded, token match); plan MUST include a `checkpoint:human-verify` task for the user to review the list before the phase completes. (Resolves A9.)
- **D-05:** Wrong-tap penalty — stays +2s (SPEC §8 default, in `GAME_DEFAULTS`).
</decisions>

## Deferred
- SQLite driver choice, server build (tsx vs bundle) → Phase 2/6.
- Git remote creation → user's call.
