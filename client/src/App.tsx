import { useState } from 'react';
import { GAME_DEFAULTS, formatTime } from '@schulte/shared';
import type { BoardSize } from '@schulte/shared';
import { vi } from './i18n/vi';
import { newSeed } from './lib/seed';
import { loadNickname, saveNickname } from './lib/storage';
import { GameScreen } from './screens/GameScreen';
import type { GameResult } from './screens/GameScreen';
import { MenuScreen } from './screens/MenuScreen';

type Screen =
  | { name: 'menu' }
  | { name: 'playing'; seed: string; size: BoardSize }
  | { name: 'result'; result: GameResult };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [nickname, setNickname] = useState<string>(() => loadNickname() ?? '');
  const [size, setSize] = useState<BoardSize>(GAME_DEFAULTS.boardSizes[0]);

  if (screen.name === 'menu') {
    return (
      <MenuScreen
        initialNickname={nickname}
        initialSize={size}
        onStart={(nick, chosen) => {
          // The app works without persistence: a false return is ignored.
          saveNickname(nick);
          setNickname(nick);
          setSize(chosen);
          setScreen({ name: 'playing', seed: newSeed(), size: chosen });
        }}
      />
    );
  }

  if (screen.name === 'playing') {
    return (
      <GameScreen
        key={screen.seed}
        seed={screen.seed}
        size={screen.size}
        onFinish={(result) => setScreen({ name: 'result', result })}
      />
    );
  }

  const { result } = screen;
  return (
    <main>
      <h1>{vi.appTitle}</h1>
      <p>
        <strong>{vi.result.title}</strong> {vi.result.seconds(formatTime(result.finalMs))}
      </p>
    </main>
  );
}
