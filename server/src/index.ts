// Server skeleton (Phase 1). Proves the server workspace consumes @schulte/shared.
//
// Intentionally opens no port and has no HTTP/socket dependency (threat T-05-03).
// Phase 2 adds: Socket.IO rooms, static serving of the client build, SQLite.
// Open decisions for Phase 2/6:
//   - server production build: tsx at runtime vs an esbuild bundle (shared ships raw .ts)
//   - SQLite driver: better-sqlite3 vs built-in node:sqlite (re-run package legitimacy checks)
//   - effective config: the server must serve the config it enforces so the client never
//     displays a penalty different from the server's (research Pitfall 8)
import { GAME_DEFAULTS } from '@schulte/shared';

console.log(`[schulte-server] skeleton OK - shared config: ${JSON.stringify(GAME_DEFAULTS)}`);
