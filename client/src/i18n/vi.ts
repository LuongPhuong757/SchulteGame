// Central Vietnamese UI strings (UI-02). Later plans extend this object.
import { GAME_DEFAULTS } from '@schulte/shared';
import type { NicknameError } from '@schulte/shared';

const { minLength, maxLength } = GAME_DEFAULTS.nickname;

// Keyed by every NicknameError so a new reason code fails typecheck. Neutral
// wording: never echoes the input or the matched blocked word (ID-01).
const nicknameErrors: Record<NicknameError, string> = {
  too_short: `Biệt danh cần ít nhất ${minLength} ký tự`,
  too_long: `Biệt danh tối đa ${maxLength} ký tự`,
  bad_chars: 'Chỉ dùng chữ, số, khoảng trắng và các dấu _ . -',
  blocked: 'Biệt danh không phù hợp, vui lòng chọn tên khác',
};

export const vi = {
  appTitle: 'Bảng Schulte',
  start: 'Bắt đầu',
  menu: {
    nicknameLabel: 'Biệt danh',
    nicknameHint: 'Nhập biệt danh của bạn',
    sizeLabel: 'Cỡ bảng',
    sizeOption: (n: number): string => `${n}×${n}`,
  },
  nicknameErrors,
  result: {
    title: 'Hoàn thành!',
    seconds: (t: string): string => `${t} giây`,
    greeting: (nickname: string): string => `Giỏi lắm, ${nickname}!`,
    breakdown: (rawText: string, wrongCount: number, penaltySeconds: number): string =>
      `Thời gian chạm ${rawText} giây` +
      (wrongCount > 0 ? ` + ${wrongCount} lần chạm sai × ${penaltySeconds} giây` : ''),
    replay: 'Chơi lại',
    changeSize: 'Đổi cỡ bảng',
  },
  game: {
    next: (n: number): string => `Tiếp theo: ${n}`,
    timeLabel: 'Thời gian',
    wrongTaps: (count: number, penaltySeconds: number): string =>
      `Chạm sai: ${count} (+${count * penaltySeconds} giây)`,
  },
};
