import { useState } from 'react';
import { formatTime } from '@schulte/shared';
import { vi } from './i18n/vi';
import { newSeed } from './lib/seed';
import { GameScreen } from './screens/GameScreen';
import type { GameResult } from './screens/GameScreen';

export function App() {
  const [seed, setSeed] = useState<string | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);

  if (seed === null) {
    return (
      <main>
        <h1>{vi.appTitle}</h1>
        <button type="button" className="btn" onClick={() => setSeed(newSeed())}>
          {vi.start}
        </button>
      </main>
    );
  }

  return (
    <>
      <GameScreen key={seed} seed={seed} size={4} onFinish={setResult} />
      {result !== null && (
        <p>
          <strong>{vi.result.title}</strong> {vi.result.seconds(formatTime(result.finalMs))}
        </p>
      )}
    </>
  );
}
