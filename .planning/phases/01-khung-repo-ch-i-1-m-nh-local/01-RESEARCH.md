# Phase 1: Khung repo + Chơi 1 mình (local) - Research

**Researched:** 2026-10-28
**Domain:** Greenfield TypeScript monorepo skeleton (npm workspaces) + mobile-first React/Vite Schulte game with pure shared game logic
**Confidence:** HIGH (toolchain was prototyped end-to-end in this session; remaining uncertainty is product rules marked [ASSUMED])

## Summary

Phase 1 is a pure-frontend deliverable (no server, no network) plus a repo skeleton designed so Phases 2-6 slot in without restructuring. The key architectural move: put everything that the server will later need to re-execute (seeded board generation, game/tap reducer, nickname validator, tunable config, time formatting) into a `shared` workspace package written as pure TypeScript with no DOM or Node APIs. The client consumes it via Vite; the server (Phase 2) consumes it via tsx. This is how SOLO-03 (server replays the tap log) and ID-01 ("same filter on client and server") get satisfied later at zero rework.

The toolchain was prototyped in a scratch workspace (shared + client + server, npm workspaces) and works: Vite 8 build, Vitest 5 with `projects`, TypeScript 7 `tsc`, jsdom component tests with pointer events, tsx running the server importing raw-`.ts` shared. **Critical environment finding:** fnm's default Node here is v20.11.0, which fails Vite 8 (requires `^20.19.0 || >=22.12.0`) and breaks the corepack pnpm shim; Node v24.20.0 is installed in fnm and works. The repo must pin Node 24 (`.node-version`, `engines`) and the plan must tell the executor to `fnm use`.

**Primary recommendation:** npm workspaces (`shared`, `client`, `server`) on Node 24; React 19 + Vite 8 + Vitest 5 + TS 7; pure `gameReducer` + `generateBoard(seed,size)` + `validateNickname` + `GAME_DEFAULTS` in `shared`; plain CSS, no router, no state library, no i18n library; tap on `pointerdown`; verify mobile layout manually on a real phone via `vite --host`.

## User Constraints

No CONTEXT.md exists (user skipped discuss-phase). No locked decisions. All of the following are Claude's discretion; items needing confirmation are in the Assumptions Log.

- Source constraints from SPEC.md / REQUIREMENTS.md still apply (Vietnamese UI, mobile-first, penalty +2s, separate repo, defaults in one config file).
- Deferred / out of scope for this phase: server, Socket.IO, SQLite, leaderboard, rooms, rate limiting, Docker, Caddy (Phases 2-6).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BOARD-01 | Chọn 4×4/5×5/6×6; bảng chứa 1..N xếp ngẫu nhiên, mỗi số đúng một lần | `shared/board.ts` seeded Fisher-Yates (verified permutation + determinism + uniformity); `BOARD_SIZES` in config |
| BOARD-02 | Chạm 1→N; đồng hồ từ lúc bắt đầu đến chạm đúng N; hiển thị thời gian cuối | Pure `gameReducer` with injected timestamps; `performance.now()` in client; `formatTime` |
| BOARD-03 | Chạm sai: +2s, ô nhá đỏ, rung, không tiến số | Reducer `wrongCount`; `wrongTapPenaltyMs`; CSS flash class; feature-detected `navigator.vibrate` |
| UI-01 | Mobile-first: ô to, chữ to, không hover | `pointerdown` handling, CSS grid + `dvh`/safe-area, `touch-action: manipulation`; manual phone UAT |
| UI-02 | Toàn bộ UI tiếng Việt | Single `client/src/i18n/vi.ts` strings module; test that renders contain no English keys |
| ID-01 | Biệt danh lọc độ dài/ký tự/từ tục; cùng bộ lọc client+server | `shared/nickname.ts` pure validator (Unicode-aware, diacritic-folding blocklist) |
| ID-02 | Biệt danh lưu trên máy, điền sẵn | `localStorage` wrapper with try/catch + re-validate on read |
| SOLO-01 | Nhập biệt danh, chọn cỡ, chơi 1 mình (local) | Screen state machine menu -> playing -> result; no server dependency |
| OPS-07 | Repo riêng, không trong monorepo OrderQuanBaLun | Verified: `git rev-parse --show-toplevel` = `/Users/m1macbook/Desktop/SchulteGame` (own repo, no remote yet) |
| OPS-08 | Mặc định chỉnh được trong một file cấu hình | `shared/src/config.ts` exporting `GAME_DEFAULTS` (typed, `as const`, ms units) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Board generation from seed | Shared (pure lib) | Browser (Phase 1 caller), API (Phase 2 caller) | Must be byte-identical on both sides; pure function of (seed,size) |
| Tap validation / penalty / finish logic | Shared (pure reducer) | Browser (Phase 1), API (Phase 2 replay, Phase 3+ referee) | Server replays same logic; client uses it for instant feedback |
| Timer (wall clock) | Browser | API (later, authoritative in rooms) | Phase 1 has no server; client measures with `performance.now()` |
| Nickname validation | Shared (pure lib) | Browser (UX), API (enforcement) | ID-01 requires one filter used on both |
| Nickname persistence | Browser (localStorage) | — | ID-02; no accounts |
| Tunable defaults | Shared (config module) | Server env override later | OPS-08; one file, imported by both |
| Haptics / red flash | Browser | — | Device APIs |
| UI text (Vietnamese) | Browser | Shared (message codes later) | Strings centralized client-side now |
| Server skeleton | API / Backend (stub) | — | Phase 1 only proves the workspace imports shared |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 24.20.0 (installed via fnm) | Runtime for dev/build/test | Vite 8 needs `^20.19.0 \|\| >=22.12.0`; vitest 5 needs `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` [VERIFIED: npm registry engines]. Default fnm node (20.11.0) fails Vite 8 (observed import error) |
| npm workspaces | npm 11.19.0 (bundled with Node 24) | Monorepo of `shared`/`client`/`server` | Zero extra tooling, Docker-friendly later; pnpm under Node 20.11 crashed (corepack) in this env |
| react / react-dom | 19.3.1 | UI | Required by spec (React + Vite) [VERIFIED: npm registry] |
| vite | 8.3.5 | Dev server + build | Required by spec; built OK in prototype [VERIFIED: ran `vite build` in scratch workspace] |
| @vitejs/plugin-react | 6.1.2 | JSX/Fast Refresh | peer `vite ^8.0.0` [VERIFIED: npm view peerDependencies] |
| typescript | 7.0.2 | Typecheck (`tsc --noEmit`) | `tsc` 7.0.2 typechecked client prototype with `moduleResolution: bundler` [VERIFIED: ran in scratch]. Fallback: pin `^5` if a tool chokes |
| vitest | 5.0.5 | Tests (unit + component) | Same config as Vite; `test.projects` verified with node + jsdom projects [VERIFIED: ran in scratch] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsdom | 30.1.3 | DOM env for component tests | client project only |
| @testing-library/react | 16.3.3 | Component tests | peer `@testing-library/dom ^10`, react 18/19 [VERIFIED: npm view] |
| @testing-library/dom | 10.x (peer; npm resolved) | Peer of RTL | Install explicitly in `client` |
| tsx | 4.23.15 | Run server TS (stub now, real server Phase 2) | `server` dev script; ran raw-`.ts` shared import OK |
| @types/react, @types/react-dom | ^19 | Types | client |
| @types/node | ^24 | Types | server + vite config (match Node major) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm workspaces | pnpm 11 | Works only under Node 24 here; adds corepack failure mode for no gain at 3 packages |
| Hand-written mulberry32 | `seedrandom` | A 6-line PRNG pinned by golden tests is safer than a dependency whose output must stay identical across client+server versions |
| Hand-written Vietnamese blocklist | `obscenity` / `bad-words` | English-focused; no Vietnamese dataset; diacritic folding needed anyway |
| State-based screens | react-router | URL routing not needed until room deep-links (Phase 3); avoid now |
| Plain CSS | Tailwind / CSS-in-JS | One small stylesheet is enough; less build surface |
| `onClick` | `onPointerDown` | Handled below (use pointerdown for speed, keyboard fallback) |

**Installation (executor, under Node 24):**
```bash
fnm use 24.20.0
npm install            # at repo root, installs all workspaces
# client deps:  react react-dom ; dev: vite @vitejs/plugin-react vitest typescript @types/react @types/react-dom jsdom @testing-library/react @testing-library/dom
# server dev:   tsx @types/node
# root dev:     vitest typescript   (so `npx vitest` / `tsc` resolve at root)
```
Versions verified 2026-10-28 via `npm view <pkg> version`: react 19.3.1, vite 8.3.5, @vitejs/plugin-react 6.1.2, vitest 5.0.5, typescript 7.0.2, jsdom 30.1.3, @testing-library/react 16.3.3, tsx 4.23.15, @types/node 26.6.5 latest (use `^24` to match runtime).

## Package Legitimacy Audit

Run: `gsd-tools query package-legitimacy check --ecosystem npm ...` on 2026-10-28.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react | npm | 14 yrs | ~166M/wk | github.com/react/react (per registry) | SUS (too-new latest version, 2026-10-14) | Approved w/ single lockfile checkpoint |
| react-dom | npm | 14 yrs | ~156M/wk | same | SUS (too-new) | same |
| vite | npm | 6 yrs | ~172M/wk | github.com/vitejs/vite | SUS (too-new, 2026-10-21) | same |
| @vitejs/plugin-react | npm | multi-yr | ~83M/wk | github.com/vitejs/vite-plugin-react | SUS (too-new) | same |
| vitest | npm | 4.9 yrs | ~114M/wk | github.com/vitest-dev/vitest | SUS (too-new) | same |
| jsdom | npm | 15 yrs | ~100M/wk | github.com/jsdom/jsdom | SUS (too-new) | same |
| @types/node | npm | multi-yr | ~404M/wk | DefinitelyTyped | SUS (too-new) | same |
| typescript | npm | 14 yrs | ~267M/wk | microsoft/TypeScript | OK | Approved |
| @testing-library/react | npm | multi-yr | ~60M/wk | testing-library | OK | Approved |
| @testing-library/dom | npm | multi-yr | ~74M/wk | testing-library | OK | Approved |
| tsx | npm | multi-yr | ~89M/wk | github.com/privatenumber/tsx | OK | Approved |
| @types/react, @types/react-dom | npm | multi-yr | 127-149M/wk | DefinitelyTyped | OK | Approved |

**Packages removed (SLOP):** none.
**Packages flagged SUS:** react, react-dom, vite, @vitejs/plugin-react, vitest, jsdom, @types/node. The only reason code is `too-new` (the *latest version* was published within the seam's recency window); package age is 5-15 years, downloads are 100M+/week, source repos present, no postinstall. This is a false positive of the recency heuristic. Planner: add ONE `checkpoint:human-verify` task after first `npm install` ("review package-lock.json top-level versions match the table") rather than one per package. Optionally pin `~` ranges until the user is comfortable.
**Transitive note:** `esbuild` (via tsx) has `postinstall: node install.js` [VERIFIED: npm view esbuild scripts.postinstall]; npm 11 prints an `allowScripts` warning. Expected and harmless (binary selection); do not run `npm install-scripts approve` blindly.

All package names were confirmed against official-project docs knowledge plus the legitimacy seam; no package was discovered from WebSearch.

## Architecture Patterns

### System Architecture Diagram (Phase 1 runtime + later slots)

```
Phone browser (Vite dev: http://<LAN-IP>:5173 via `vite --host`)
 |
 |  user taps
 v
[Menu screen] --nickname text--> shared.validateNickname --ok--> localStorage 'schulte:nickname'
      |                                   |--error--> inline Vietnamese message (vi.ts)
      | choose size (4|5|6) + "Bắt đầu" (real button click = sticky user activation)
      v
[Game screen]
  seed = crypto.getRandomValues-derived string   (Phase 2: seed comes from server)
  board = shared.generateBoard(seed,size)
  state = shared.gameReducer(state, {type:'tap', value, t:performance.now()})
      |-- correct --> next++ ; mark cell found
      |-- wrong   --> wrongCount++ ; red flash (CSS) ; navigator.vibrate?.(…) if supported
      |-- value==N -> status 'finished'
      v
[Result screen] finalMs = (finishedAt-startedAt) + wrongCount*GAME_DEFAULTS.wrongTapPenaltyMs
      |-- "Chơi lại" -> new seed, same size   |-- "Đổi cỡ bảng" -> Menu
      (tap log {seed,size,taps:[{value,t}]} kept in state: Phase 2 submits it)

Later phases plug in without moving files:
  server/src (Phase 2+) --imports--> @schulte/shared  (replay log via same gameReducer, same validateNickname, same config)
```

### Recommended Project Structure
```
SchulteGame/
├── package.json            # private, "type":"module", workspaces:["shared","client","server"], engines node >=22.12, scripts
├── .node-version           # 24.20.0  (fnm reads this; also document `fnm use`)
├── .gitignore              # node_modules, dist, *.log, .DS_Store  (NOT .planning)
├── .editorconfig
├── tsconfig.base.json      # strict, noUncheckedIndexedAccess, moduleResolution bundler, target ES2022, skipLibCheck
├── vitest.config.ts        # root `test.projects`: shared(node) + client(jsdom)
├── README.md               # how to run on Node 24, phone testing, scripts
├── shared/                 # @schulte/shared — "exports": {".": "./src/index.ts"}
│   └── src/
│       ├── config.ts       # GAME_DEFAULTS (OPS-08)
│       ├── rng.ts          # hashSeed, mulberry32
│       ├── board.ts        # generateBoard, BoardSize
│       ├── game.ts         # GameState, TapEvent, gameReducer, finalTimeMs
│       ├── nickname.ts     # validateNickname (+ blocklist data file)
│       ├── time.ts         # formatTime
│       ├── index.ts        # barrel
│       └── *.test.ts       # co-located
├── client/                 # @schulte/client
│   ├── index.html          # lang="vi", viewport meta
│   ├── vite.config.ts      # react plugin, server.host
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx, App.tsx (screen state)
│       ├── screens/ MenuScreen, GameScreen, ResultScreen
│       ├── components/ Board, Cell, Timer
│       ├── hooks/ useGame, useNickname
│       ├── lib/ storage.ts, haptics.ts, seed.ts
│       ├── i18n/vi.ts
│       └── styles.css
├── server/                 # @schulte/server — STUB only in Phase 1
│   └── src/index.ts        # imports GAME_DEFAULTS from shared, logs; optional node:http /healthz
└── .planning/
```

### Pattern 1: Pure reducer with injected time (reused by server replay)
**What:** `gameReducer(state, event)` takes the timestamp inside the event; it never calls `Date.now()`/`performance.now()`. Client passes `performance.now()`; Phase 2 server passes timestamps from the submitted log; Phase 3 server passes its own clock.
**When to use:** all tap handling. This is what makes SOLO-03 and RACE-03 cheap later.
```typescript
// shared/src/game.ts  (design sketch; values from GAME_DEFAULTS)
export type TapEvent = { value: number; t: number };            // t = ms since an arbitrary origin
export type GameState = {
  status: 'idle' | 'playing' | 'finished';
  size: 4 | 5 | 6; total: number;       // total = size*size
  next: number;                          // next expected number, starts 1
  wrongCount: number;
  startedAt: number | null; finishedAt: number | null;
  taps: TapEvent[];                      // full log, wrong taps included
};
// events: {type:'start', t} | {type:'tap', value, t}
// correct: value === next -> next++, finished when value === total
// wrong:   value !== next && value > next?  (see Open Question 1 about already-found cells)
export const finalTimeMs = (s: GameState, penaltyMs: number) =>
  (s.finishedAt! - s.startedAt!) + s.wrongCount * penaltyMs;
```

### Pattern 2: Seeded board (shared, deterministic)
**What:** FNV-1a string hash -> mulberry32 -> Fisher-Yates. Uses only `Math.imul` and integer ops so it is identical in browsers and Node.
```typescript
// shared/src/rng.ts + board.ts  [VERIFIED: executed in scratchpad; permutation holds for 4/5/6, deterministic, position-of-1 histogram over 32,000 seeds min 1940 / max 2108 of expected 2000]
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function generateBoard(seed: string, size: number): number[] {
  const n = size * size;
  const a = Array.from({ length: n }, (_, i) => i + 1);
  const rand = mulberry32(hashSeed(seed));
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
// Golden vectors observed (pin them in tests; any change breaks Phase 2 replay):
// generateBoard('abc',4) -> 4,5,14,8,7,2,3,13,11,15,6,16,12,1,10,9
// generateBoard('abc',5) -> 17,6,19,4,9,11,22,21,2,14,3,23,15,8,5,7,25,12,18,10,24,20,1,16,13
```
Seed generation on the client (Phase 1 only): `crypto.getRandomValues(new Uint32Array(2))` -> hex string. Never `Math.random` for the seed. Keep seed a string so Phase 2 can swap in a server-issued opaque token.

### Pattern 3: Mobile tap handling
- `onPointerDown` on each cell (no 300 ms click delay, registers on touch-down); also `onKeyDown` Enter/Space for keyboard users; cells are `<button type="button">`.
- CSS: `touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;` on board; `overscroll-behavior: none` on body.
- Layout: `.board { display:grid; grid-template-columns: repeat(var(--n), 1fr); gap; width: min(100vw - 2*pad, 100dvh - header); aspect-ratio: 1 }`; cell font via `clamp()` or container query units; padding with `env(safe-area-inset-*)`; `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. 6x6 on a 360 px wide phone gives roughly 55 px cells (above the 44 px touch-target guideline).
- Wrong-tap flash: set a `wrong` class keyed by a counter so the CSS animation restarts on repeated wrong taps (~300 ms).
- Haptics: `haptics.ts` exports `vibrate(ms)` = `if ('vibrate' in navigator) navigator.vibrate(ms)`. Call only after the user has clicked Start (sticky user activation required, MDN). iOS Safari does not implement `navigator.vibrate` (call is a silent no-op / absent per caniuse), so the red flash must be sufficient on its own; do not treat vibration as the only error signal.
- Timer display: derive from `performance.now()` each tick (rAF or 50-100 ms interval); never accumulate ticks. Display rounding is cosmetic only; final value is computed from timestamps.

### Anti-Patterns to Avoid
- **Putting game rules in React components:** server cannot reuse them; all rules live in `shared`.
- **Calling `Date.now()` inside `shared`:** breaks replay/determinism; inject `t`.
- **Scattering `2000`, `4`, `15000` literals:** violates OPS-08; import from `GAME_DEFAULTS`.
- **Using `Math.random` for board shuffle:** cannot be regenerated from seed.
- **Using `onClick` for cells:** perceptible latency on mobile and double-tap zoom risk.
- **Hard-coded Vietnamese strings in JSX:** centralize in `i18n/vi.ts` (testability of UI-02).
- **Letting default fnm Node (20.11) run builds:** Vite 8 fails; enforce `.node-version` + `engines`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bundler/dev server/HMR | custom scripts | Vite 8 | Spec mandates; phone testing via `--host` |
| Test runner / DOM env | custom harness | Vitest 5 + jsdom + RTL | Verified working with pointer events and navigator stubs |
| Unicode letter classes | manual Vietnamese char ranges | `\p{L}`, `\p{M}`, `\p{N}` with `u` flag + `normalize('NFC')` | Diacritics have precomposed and decomposed forms; verified both forms of "Nguyễn Văn A" accepted identically |
| Diacritic folding for blocklist | per-letter replace maps | `normalize('NFD').replace(/\p{M}/gu,'')` plus explicit `đ->d` (Đ is not decomposed by NFD) | Verified: `fold('Đụ Mẹ ĐỒ')` = `du me do` |
| Secure random seed | custom entropy | `crypto.getRandomValues` | Browser built-in |
| Class-name merging, state libs, router, i18n lib | any | none needed | 3 screens, one reducer |

(Not "don't hand-roll": the 6-line PRNG and the validator; both are tiny, must be identical on both tiers, and are pinned by golden tests.)

**Key insight:** the expensive failure modes here are cross-tier divergence (client and server computing different boards/penalties/nickname verdicts) and mobile feel. Both are solved by shared pure code + real-phone testing, not libraries.

## Common Pitfalls

### Pitfall 1: Wrong Node version
**What goes wrong:** `vite build` / `vitest` crash with import errors on Node 20.11; pnpm via corepack crashes (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`).
**Why:** fnm default is 20.11.0; Vite 8 needs 20.19+/22.12+, vitest 5 needs 22.12+/24+.
**Avoid:** `.node-version` = 24.20.0, root `engines.node: ">=22.12"`, README step `fnm use`, first plan task runs `node -v`.
**Warning signs:** stack trace from `node:internal/modules/esm` on first `npx vite`.

### Pitfall 2: Shared package exposing raw `.ts`
**What goes wrong:** works under Vite/Vitest/tsx but a plain `node` production run or Docker `npm ci --omit=dev` breaks later.
**Why:** `exports: ./src/index.ts` is only understood by TS-aware tools. (Node 24 native type stripping did run the prototype, but it rejects extensionless relative imports and enums; do not rely on it.)
**Avoid:** keep `shared` free of enums/path aliases and use consistent imports; Phase 2/6 decide server prod build (bundle with esbuild/tsx). Note in README; not a Phase 1 blocker.

### Pitfall 3: Penalty applied twice or lost
**What goes wrong:** timer UI shows penalty but final time omits it, or counts a tap twice (pointerdown + click).
**Avoid:** single source `finalTimeMs`; only `onPointerDown` mutates state; test with N wrong taps -> `elapsed + N*penalty`.

### Pitfall 4: localStorage unavailable
**What goes wrong:** Safari private mode / blocked storage throws, crashing the menu.
**Avoid:** wrapper with try/catch on get and set; on read, re-run `validateNickname` and drop invalid stored values; app must work with no persistence (verified pattern: stubbing `Storage.prototype.getItem` to throw is testable in jsdom).

### Pitfall 5: Nickname filter false positives (Scunthorpe) and bypasses
**What goes wrong:** substring blocklist rejects innocent names; leetspeak/diacritic/spacing variants bypass it. Folding removes diacritics, so distinct Vietnamese words collapse to the same ASCII (e.g. several words fold to the same 3-letter token).
**Avoid:** fold -> lowercase -> map digits/leet (0->o, 1->i, 3->e, 4->a) -> split into tokens on non-alphanumerics; reject if any token equals a short blocklist entry, or the compacted string contains a long (>=5 chars) multi-syllable entry. Keep the list small and in a separate data file; accept some conservatism; always show a neutral Vietnamese message ("Biệt danh không phù hợp"). Unit-test both reject and accept cases including common Vietnamese names containing the same letters (e.g. "Long", "Đạt", "Lan Anh").
**Do not** write the profanity list from memory without user review (see Open Question 3).

### Pitfall 6: RTL / control / emoji characters in names
**Avoid:** allow-list regex `^[\p{L}\p{N} _.\-]+$` (verified rejects `😀😀`, `<script>`, U+202E RLO). Names are rendered as React text (auto-escaped), so no XSS path; the allow-list also protects Phase 2 SQL/leaderboard display.

### Pitfall 7: Viewport and iOS quirks
**What goes wrong:** 100vh overflow under iOS URL bar; double-tap zoom; long-press selects digits; pull-to-refresh interrupts a run.
**Avoid:** `100dvh`, `touch-action: manipulation`, `user-select:none`, `-webkit-touch-callout:none`, `overscroll-behavior: none`. Verify on a physical phone.

### Pitfall 8: Config divergence later
**What goes wrong:** if Phase 2+ lets the server override `GAME_DEFAULTS` via env, a client bundle built with different constants will display different penalty than the server enforces.
**Avoid:** Phase 1 plain constants; leave a comment and note for Phase 2: server serves effective config (`GET /api/config`) or env overrides only the server-only keys.

## Code Examples

### Config file (OPS-08)
```typescript
// shared/src/config.ts
// Requirement values quoted from REQUIREMENTS.md OPS-08 [VERIFIED: .planning/REQUIREMENTS.md:71]:
// "phạt 2s, khoá 2s, mã 4 số, phòng hết hạn 10 phút, vào lại 15s, tối đa 4 người"
export const GAME_DEFAULTS = {
  wrongTapPenaltyMs: 2_000,
  grabLockMs: 2_000,
  roomCodeLength: 4,
  roomIdleExpiryMs: 10 * 60 * 1_000,
  reconnectGraceMs: 15_000,
  maxPlayersPerRoom: 4,
  boardSizes: [4, 5, 6],
  nickname: { minLength: 2, maxLength: 16 },   // proposed, see Assumptions A2
} as const;
export type BoardSize = (typeof GAME_DEFAULTS.boardSizes)[number];
```
Use `Ms` suffix on every duration key; the test asserts the six SPEC defaults equal the values above, so changing a default is a deliberate one-file edit.

### Nickname validator skeleton
```typescript
// shared/src/nickname.ts  [VERIFIED: length/charset/normalization logic executed in scratchpad]
const ALLOWED = /^[\p{L}\p{N} _.\-]+$/u;
export type NicknameResult =
  | { ok: true; value: string }
  | { ok: false; reason: 'too_short' | 'too_long' | 'bad_chars' | 'blocked' };
export function validateNickname(raw: string): NicknameResult {
  const s = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  const len = [...s].length;                       // code points, not UTF-16 units
  if (len < 2) return { ok: false, reason: 'too_short' };
  if (len > 16) return { ok: false, reason: 'too_long' };
  if (!ALLOWED.test(s)) return { ok: false, reason: 'bad_chars' };
  // if (isBlocked(s)) return { ok: false, reason: 'blocked' };   // folded-token check, data file
  return { ok: true, value: s };
}
export const fold = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
```
Return reason codes (not Vietnamese strings) from `shared`; the client maps codes -> `vi.ts` text; Phase 2 server returns the same codes.

### Vitest root config (projects) [VERIFIED: ran in scratch]
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { projects: [
  { test: { name: 'shared', root: './shared', environment: 'node' } },
  { extends: './client/vite.config.ts', test: { name: 'client', root: './client', environment: 'jsdom' } },
]}});
```
Client `vite.config.ts`: `defineConfig` from `vitest/config`, `plugins: [react()]`, `server: { host: true }` (LAN access: "Set this to 0.0.0.0 or true" per vite.dev/config/server-options).

### Component test stubbing vibrate/pointer [VERIFIED: ran in scratch]
```typescript
Object.defineProperty(navigator, 'vibrate', { value: vi.fn(), configurable: true });
fireEvent.pointerDown(screen.getByRole('button', { name: '7' }));
expect(navigator.vibrate).toHaveBeenCalled();
```
jsdom has no `navigator.vibrate` by default (verified `typeof === 'undefined'`), which also covers the iOS-like path.

### Root scripts
`dev` (`npm run dev -w client`), `build` (`npm run build -w client`), `typecheck` (`npm run typecheck --workspaces --if-present`), `test` (`vitest run`), `test:watch` (`vitest`). Server `dev` script: `tsx watch src/index.ts`.

## Runtime State Inventory

Not applicable (greenfield, no rename/refactor/migration).

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Vite 5-6 (esbuild/rollup) | Vite 8.x (current major on registry) | Needs Node 22.12+/20.19+; `@vitejs/plugin-react` 6 |
| Jest + babel | Vitest 5 | Shared Vite config; `test.projects` replaces workspace file |
| `click` handlers on mobile | `pointerdown` + `touch-action: manipulation` | Lower latency |
| `vh` | `dvh` + safe-area env() | Correct iOS toolbar behaviour |

**Deprecated/outdated:** `vitest.workspace.ts` (use `test.projects`); relying on `navigator.vibrate` on iOS (unsupported on all iOS Safari versions listed by caniuse).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Clock starts when the board is revealed after pressing "Bắt đầu" (not at first tap) | Architecture / BOARD-02 | Timing semantics differ from user's expectation; also affects Phase 2 replay origin |
| A2 | Nickname rules: 2-16 code points, letters/digits/space/`_ . -`, NFC, collapse whitespace | Code Examples / ID-01 | User may want other limits (REQUIREMENTS says "chốt khi plan") |
| A3 | Tapping an already-found number is ignored (no penalty); found cells stay visible but muted | Pattern 1 | If SPEC intends it as wrong, penalty logic and Phase 2 replay rule change |
| A4 | Show the "next number" hint ("Tiếp theo: N") above the board | UI | Changes game difficulty slightly; cosmetic |
| A5 | Result time formatted Vietnamese style with decimal comma, 2 decimals (e.g. "12,34 giây"), shows breakdown (raw + penalties) | UI | Cosmetic |
| A6 | Chrome requires sticky (not transient) activation for `vibrate`, so the Start button click suffices; `pointerdown` on touch may not itself count as activation | Pattern 3 | Vibration might not fire if activation model differs; red flash is the fallback |
| A7 | TS 7.0.2 is acceptable (prototype passed); if future tooling (eslint plugins) breaks, pin ^5 | Standard Stack | Minor tooling friction |
| A8 | No ESLint/Prettier in Phase 1; `tsc --noEmit` + tests are the gates | Standard Stack | Style drift (low) |
| A9 | Profanity list content (Vietnamese) must be user-approved; planner should not invent exhaustive list | Pitfall 5 | Offensive names slip through or innocent names blocked |

## Open Questions

1. **Already-found number tapped again: wrong or ignored?**
   - Known: SPEC says only "Chạm sai số: +2 giây phạt".
   - Unclear: whether a previously-found number counts as wrong.
   - Recommendation: ignore (accidental double-taps are common on phones); lock the rule in a reducer test because Phase 2 replay must match.
2. **When does the clock start?** Recommend on board reveal after Start (hides the board until ready). Confirm with user (A1).
3. **Profanity blocklist source.** Recommend a small curated Vietnamese list (abbreviations and a few unambiguous words) in `shared/src/nickname-blocklist.ts`, reviewed by user; planner should include a user-review checkpoint.
4. **Server skeleton scope.** Recommend stub only (imports shared config, prints it, optional `/healthz`); no express/socket.io/better-sqlite3 installs until Phase 2. Phase 2 must decide server prod build (tsx vs esbuild bundle) and SQLite driver (`better-sqlite3` 13.0.3 vs built-in `node:sqlite`) and re-run legitimacy checks then.
5. **Git remote.** Repo is already its own git repo (no remote). OPS-07 is satisfied locally; whether to create a GitHub remote is the user's call, outside this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| fnm | Node switching | yes | installed; versions 20.11.0 (default), 24.20.0, system | — |
| Node 24 | Vite 8 / Vitest 5 | yes | v24.20.0 | Node 22.12+ also OK (not installed) |
| Node 20.11 (default) | — | yes but unusable | v20.11.0 | Fails Vite 8; do not use |
| npm | workspaces | yes | 11.19.0 under Node 24 (10.2.4 under 20.11) | — |
| pnpm | — | broken under Node 20.11, 11.24.0 under Node 24 | not needed | use npm |
| Physical phone on same Wi-Fi | UI-01 manual UAT | unknown (user's) | — | Chrome devtools device emulation (cannot verify haptics/real touch feel) |
| Chrome/Playwright | optional e2e | not probed; not required | — | manual UAT |

**Missing with no fallback:** none. **Action required:** every executor command must run under Node 24 (`fnm use 24.20.0` or `.node-version` + `fnm use`; the default shell node is 20.11).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 5.0.5 (+ jsdom 30.1.3, @testing-library/react 16.3.3) |
| Config file | `/Users/m1macbook/Desktop/SchulteGame/vitest.config.ts` (Wave 0, new) |
| Quick run command | `npx vitest run --project shared` |
| Full suite command | `npm test` (= `vitest run`, both projects) and `npm run typecheck` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOARD-01 | Permutation of 1..N for 4/5/6; deterministic by seed; golden vectors; different seeds differ | unit | `npx vitest run --project shared board` | Wave 0 |
| BOARD-02 | Reducer: correct sequence 1..N finishes; time = finishedAt-startedAt (+penalties) | unit | `npx vitest run --project shared game` | Wave 0 |
| BOARD-03 | Wrong tap: wrongCount++, `next` unchanged, final = elapsed + k*penalty; UI adds `wrong` class + calls vibrate when present, no throw when absent | unit + component | `npx vitest run game GameScreen` | Wave 0 |
| UI-01 | Board renders N^2 buttons; uses pointerdown; no `:hover` rules in CSS (grep); actual layout/tap feel on phone | component + manual | `npx vitest run --project client Board` ; manual UAT | Wave 0 |
| UI-02 | No hard-coded English in screens; all visible strings come from `vi.ts` (spot assertions on key screens) | component | `npx vitest run --project client i18n` | Wave 0 |
| ID-01 | Valid/invalid by length, charset, blocklist, diacritic/NFD forms, leet variants; accepted common names | unit | `npx vitest run --project shared nickname` | Wave 0 |
| ID-02 | Save on valid submit, prefill on mount, tolerate throwing storage, drop invalid stored value | component | `npx vitest run --project client nickname` | Wave 0 |
| SOLO-01 | Menu -> choose size -> play -> result full flow with no network | component (flow) | `npx vitest run --project client App` | Wave 0 |
| OPS-07 | Repo root is its own git repo, not inside another | smoke | `test "$(git rev-parse --show-toplevel)" = "$PWD"` | n/a |
| OPS-08 | Six SPEC defaults live in `GAME_DEFAULTS` with expected values; no stray literals (grep `2000`, `15000` outside config/tests) | unit + grep | `npx vitest run --project shared config` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --project shared` (or the touched project), < 10 s
- **Per wave merge:** `npm test && npm run typecheck && npm run build`
- **Phase gate:** full suite green + manual phone UAT checklist before `/gsd-verify-work`

### Manual-only (justified: jsdom has no layout/haptics)
- On a real phone (Android Chrome and iPhone Safari) via `npm run dev -- --host`: 4x4/5x5/6x6 cells comfortably tappable at 360 px width; no zoom/selection/scroll glitches; wrong tap flashes red (and vibrates on Android); final time = elapsed + 2 s per wrong tap; nickname prefilled after reload.

### Wave 0 Gaps
- [ ] `vitest.config.ts`, `tsconfig.base.json`, per-package `tsconfig.json`, `package.json` scripts
- [ ] `shared/src/{board,game,nickname,config,time}.test.ts`
- [ ] `client/src/**/*.test.tsx` (Board, GameScreen, Menu/nickname, App flow, i18n)
- [ ] Framework install: `npm install` under Node 24

## Security Domain

`security_enforcement` not disabled (no config.json; treated as enabled). Phase 1 has no network surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no accounts by design |
| V3 Session Management | no | none |
| V4 Access Control | no | none in Phase 1 |
| V5 Input Validation | yes | allow-list nickname validator in `shared` (re-used by server in Phase 2); React text rendering (auto-escape) |
| V6 Cryptography | minimal | `crypto.getRandomValues` for seed only; no secrets |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via nickname | Tampering | allow-list charset + never `dangerouslySetInnerHTML` |
| Unicode spoofing / RTL override in name | Spoofing | reject control/format chars via allow-list (U+202E verified rejected) |
| Tampered localStorage nickname | Tampering | re-validate on read |
| Client-side cheating (edit timer/log) | Tampering | Out of scope now; Phase 2 server replay is the control; keep tap log in state to enable it |
| Supply chain (new package versions) | Tampering | lockfile committed; one human-verify checkpoint; no unneeded deps |

## Project Constraints (from CLAUDE.md)

No `./CLAUDE.md` or `.claude/` directory in the repo; no project skills. Organization-level rules apply to assistants only (concise output). Project constraints come from SPEC/REQUIREMENTS: Vietnamese UI, mobile-first/no hover, separate repo, tunables in one config file.

## Sources

### Primary (HIGH confidence)
- Local prototype (scratchpad workspace, Node 24.20.0): vite build, vitest projects, tsc 7.0.2, tsx importing shared `.ts`, RTL pointer/vibrate/localStorage tests, seeded board and nickname snippets [VERIFIED: executed]
- npm registry via `npm view` (versions, engines, peerDependencies, scripts) and `gsd-tools query package-legitimacy check` [VERIFIED: tool]
- `/Users/m1macbook/Desktop/SchulteGame/.planning/REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `PROJECT.md`, `SPEC.md` [VERIFIED: read]

### Secondary (MEDIUM confidence)
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate [CITED: sticky user activation required; true return does not guarantee vibration]
- https://vite.dev/config/server-options.html [CITED: `server.host` true/0.0.0.0 for LAN; `server.proxy` with `ws: true` for later phases]
- https://caniuse.com/mdn-api_navigator_vibrate via WebSearch [CITED: not supported on iOS Safari]

### Tertiary (LOW confidence)
- Third-party report that iOS Safari haptic workaround via `<input switch>` was patched in iOS 26.5; not used in the plan.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, built and ran in a prototype
- Architecture: HIGH, direct consequence of SPEC §5 and roadmap phases
- Pitfalls: MEDIUM-HIGH; mobile/iOS behaviours need real-device confirmation
- Product-rule choices (A1-A5, A9): LOW until user confirms

**Research date:** 2026-10-28
**Valid until:** ~7-14 days for exact versions (fast-moving Vite/Vitest/TS majors); architecture valid for the whole milestone
