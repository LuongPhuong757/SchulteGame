// Central Vietnamese UI strings (UI-02). Later plans extend this object.
export const vi = {
  appTitle: 'Bảng Schulte',
  start: 'Bắt đầu',
  result: {
    title: 'Hoàn thành!',
    seconds: (t: string): string => `${t} giây`,
  },
  game: {
    next: (n: number): string => `Tiếp theo: ${n}`,
    timeLabel: 'Thời gian',
    wrongTaps: (count: number, penaltySeconds: number): string =>
      `Chạm sai: ${count} (+${count * penaltySeconds} giây)`,
  },
};
