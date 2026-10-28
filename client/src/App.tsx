import { useEffect, useReducer, useState } from 'react';
import { createGame, finalTimeMs, formatTime, gameReducer } from '@schulte/shared';
import { Board } from './components/Board';
import { vi } from './i18n/vi';
import { newSeed } from './lib/seed';

function Game({ seed }: { seed: string }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame(seed, 4));

  useEffect(() => {
    // D-02: the clock starts when the board is revealed. Harmless under StrictMode
    // double-invocation because start is a no-op unless status is 'ready'.
    dispatch({ type: 'start', t: performance.now() });
  }, []);

  return (
    <main>
      <h1>{vi.appTitle}</h1>
      <Board
        board={state.board}
        size={state.size}
        next={state.next}
        flash={null}
        disabled={state.status !== 'playing'}
        onTap={(value) => dispatch({ type: 'tap', value, t: performance.now() })}
      />
      {state.status === 'finished' && (
        <p>
          <strong>{vi.result.title}</strong> {vi.result.seconds(formatTime(finalTimeMs(state)))}
        </p>
      )}
    </main>
  );
}

export function App() {
  const [seed, setSeed] = useState<string | null>(null);

  if (seed === null) {
    return (
      <main>
        <h1>{vi.appTitle}</h1>
        <button type="button" onClick={() => setSeed(newSeed())}>
          {vi.start}
        </button>
      </main>
    );
  }
  return <Game key={seed} seed={seed} />;
}
