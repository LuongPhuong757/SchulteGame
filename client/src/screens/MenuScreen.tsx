import { useState } from 'react';
import type { FormEvent } from 'react';
import { GAME_DEFAULTS, validateNickname } from '@schulte/shared';
import type { BoardSize } from '@schulte/shared';
import { vi } from '../i18n/vi';

export function MenuScreen(props: {
  initialNickname: string;
  initialSize: BoardSize;
  /** nickname = validated, normalized value */
  onStart: (nickname: string, size: BoardSize) => void;
}) {
  const { initialNickname, initialSize, onStart } = props;
  const [nickname, setNickname] = useState(initialNickname);
  const [size, setSize] = useState<BoardSize>(initialSize);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateNickname(nickname);
    if (!result.ok) {
      // Message comes from vi.ts by reason code only: the input is never echoed.
      setError(vi.nicknameErrors[result.reason]);
      return;
    }
    setError(null);
    onStart(result.value, size);
  };

  return (
    <main className="menu">
      <form noValidate onSubmit={handleSubmit}>
        <label htmlFor="nickname">{vi.menu.nicknameLabel}</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          className="nickname-input"
          autoComplete="nickname"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          placeholder={vi.menu.nicknameHint}
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setError(null);
          }}
        />
        {error !== null && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="size-label" id="size-label">
          {vi.menu.sizeLabel}
        </div>
        <div className="size-group" role="group" aria-labelledby="size-label">
          {GAME_DEFAULTS.boardSizes.map((option) => (
            <button
              key={option}
              type="button"
              className="size-option"
              aria-pressed={size === option}
              onClick={() => setSize(option)}
            >
              {vi.menu.sizeOption(option)}
            </button>
          ))}
        </div>
        <button type="submit" className="btn">
          {vi.start}
        </button>
      </form>
    </main>
  );
}
