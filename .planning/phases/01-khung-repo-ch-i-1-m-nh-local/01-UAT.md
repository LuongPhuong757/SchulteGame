---
status: testing
phase: 01-khung-repo-ch-i-1-m-nh-local
source: [01-VERIFICATION.md]
started: 2026-10-28T08:20:00Z
updated: 2026-10-28T08:20:00Z
---

## Current Test

number: 1
name: Physical-phone UAT (Android Chrome + iPhone Safari, ~360px) — 4x4/5x5/6x6
expected: |
  Run `fnm exec --using=24.20.0 -- npm run dev:phone`, open the Network URL on both phones (same Wi-Fi).
  6x6 cells comfortably tappable (~44px+); no double-tap zoom, no text selection/callout on long-press,
  no pull-to-refresh during play; focusing nickname input does not zoom. Found numbers disappear.
  Wrong tap flashes only that cell red and vibrates on Android (flash only on iPhone).
  Result time = elapsed + 2s per wrong tap and matches the live timer. Nickname prefilled after reload.
  All text Vietnamese.
awaiting: user response

## Tests

### 1. Physical-phone UAT (Android Chrome + iPhone Safari, ~360px) — 4x4/5x5/6x6
expected: Touch sizing/zoom/callout/pull-to-refresh OK; red flash (+vibrate on Android); time = elapsed + 2s/wrong tap; nickname prefilled after reload; Vietnamese UI.
result: [pending]

### 2. Landscape 6x6 on phone
expected: Board fits without overflow (code review IN-05 predicts overflow — confirm or accept).
result: [pending]

### 3. Judgment-tier prohibitions review
expected: No strobe (flash confined to one cell), Vietnamese names not rejected, rejected nickname not echoed, no data leaves the device.
result: [pending]

### 4. Nickname false positives (WR-02)
expected: Decide: "Edit Me", "Bacon Cacao" currently rejected as blocked (substring check spans word boundaries) — accept as known limitation or schedule per-token fix.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
