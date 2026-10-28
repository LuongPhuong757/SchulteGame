// Single source of tunable game defaults (OPS-08).
//
// SPEC §8 defaults, quoted from REQUIREMENTS.md OPS-08:
// "phạt 2s, khoá 2s, mã 4 số, phòng hết hạn 10 phút, vào lại 15s, tối đa 4 người"
//
// Pitfall 8: when Phase 2 adds env overrides, the server must serve the
// effective config so the client never displays a penalty different from
// what the server enforces.

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) {
      deepFreeze((value as Record<PropertyKey, unknown>)[key]);
    }
  }
  return value;
}

export const GAME_DEFAULTS = deepFreeze({
  wrongTapPenaltyMs: 2_000,
  grabLockMs: 2_000,
  roomCodeLength: 4,
  roomIdleExpiryMs: 10 * 60 * 1_000,
  reconnectGraceMs: 15_000,
  maxPlayersPerRoom: 4,
  boardSizes: [4, 5, 6],
  nickname: { minLength: 2, maxLength: 16, maxInputLength: 64 },
  ui: { wrongFlashMs: 300, wrongVibrateMs: 150, timerTickMs: 50 },
} as const);

export type BoardSize = (typeof GAME_DEFAULTS.boardSizes)[number];

export function isBoardSize(n: unknown): n is BoardSize {
  return n === 4 || n === 5 || n === 6;
}
