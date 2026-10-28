import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { GAME_DEFAULTS } from '@schulte/shared';
import type { BoardSize } from '@schulte/shared';

export interface BoardProps {
  board: readonly number[];
  size: BoardSize;
  next: number;
  flash: { value: number; key: number } | null;
  disabled?: boolean;
  onTap: (value: number) => void;
}

export function Board({ board, size, next, flash, disabled = false, onTap }: BoardProps) {
  const style = {
    '--n': size,
    '--flash-ms': `${GAME_DEFAULTS.ui.wrongFlashMs}ms`,
  } as CSSProperties;

  return (
    <div className="board" style={style}>
      {board.map((value) => {
        // D-01: a found number is an empty, inert cell.
        if (value < next) {
          return (
            <button
              key={value}
              type="button"
              className="cell cell--found"
              disabled
              aria-hidden="true"
              tabIndex={-1}
            />
          );
        }

        const isWrong = flash !== null && flash.value === value;
        // Re-keying on flash.key remounts the cell so the CSS animation restarts
        // on repeated wrong taps of the same number.
        const key = isWrong ? `${value}-${flash.key}` : value;

        // Single input path (pointerdown + keyboard): no click handler on cells,
        // so one physical tap produces exactly one game event (T-03-01).
        const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
          event.preventDefault();
          if (disabled || value < next) return;
          onTap(value);
        };
        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          if (disabled || value < next) return;
          onTap(value);
        };

        return (
          <button
            key={key}
            type="button"
            className={isWrong ? 'cell cell--wrong' : 'cell'}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
