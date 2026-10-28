// Central Vietnamese UI strings (UI-02). Later plans extend this object.
export const vi = {
  appTitle: 'Bảng Schulte',
  start: 'Bắt đầu',
  result: {
    title: 'Hoàn thành!',
    seconds: (t: string): string => `${t} giây`,
  },
  game: {
    wrongTaps: (count: number, penaltySeconds: number): string =>
      `Chạm sai: ${count} (+${count * penaltySeconds} giây)`,
  },
};
