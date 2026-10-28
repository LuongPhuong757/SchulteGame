import { GAME_DEFAULTS, formatTime } from '@schulte/shared';
import { vi } from '../i18n/vi';
import type { GameResult } from './GameScreen';

export function ResultScreen(props: {
  result: GameResult;
  nickname: string;
  onReplay: () => void;
  onChangeSize: () => void;
}) {
  const { result, nickname, onReplay, onChangeSize } = props;
  return (
    <main className="result">
      <h1>{vi.appTitle}</h1>
      <h2>{vi.result.title}</h2>
      <p>{vi.result.greeting(nickname)}</p>
      <p className="result-time">{vi.result.seconds(formatTime(result.finalMs))}</p>
      <p className="result-breakdown">
        {vi.result.breakdown(
          formatTime(result.rawMs),
          result.wrongCount,
          GAME_DEFAULTS.wrongTapPenaltyMs / 1000,
        )}
      </p>
      <button type="button" className="btn" onClick={onReplay}>
        {vi.result.replay}
      </button>
      <button type="button" className="btn btn--secondary" onClick={onChangeSize}>
        {vi.result.changeSize}
      </button>
    </main>
  );
}
