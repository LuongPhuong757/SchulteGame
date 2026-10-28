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
    <div className="board" style={style} onContextMenu={(event) => event.preventDefault()}>
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
        // The cell is NOT re-keyed on a wrong tap (a remount would drop keyboard
        // focus). Instead the flash alternates between two identically-defined
        // keyframes by flash.key parity, which restarts the CSS animation on
        // repeated wrong taps of the same number without touching the node.
        const flashClass = isWrong ? ` cell--wrong cell--wrong-${flash.key % 2}` : '';

        // Single input path (pointerdown + keyboard): no click handler on cells,
        // so one physical tap produces exactly one game event (T-03-01).
        const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
          event.preventDefault();
          // Primary button / primary pointer only: a right or middle click must not
          // score. Tolerant of environments that omit the fields (undefined passes).
          if (event.button > 0 || event.isPrimary === false) return;
          if (disabled || value < next) return;
          onTap(value);
        };
        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          // Holding the key must not fire repeated taps (each wrong one costs +2 s).
          if (event.repeat) return;
          if (disabled || value < next) return;
          const cell = event.currentTarget;
          onTap(value);
          // A correct tap empties and disables this cell, which would drop focus to
          // <body>; hand it to the next unfound cell so keyboard play can continue.
          if (value === next) focusNextUnfound(cell);
        };

        return (
          <button
            key={value}
            type="button"
            className={`cell${flashClass}`}
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

/** Move focus to the next still-playable cell after `from` in DOM order, wrapping around. */
function focusNextUnfound(from: HTMLButtonElement): void {
  const cells = Array.from(from.parentElement?.querySelectorAll<HTMLButtonElement>('button.cell') ?? []);
  const start = cells.indexOf(from);
  if (start === -1) return;
  for (let step = 1; step < cells.length; step++) {
    const candidate = cells[(start + step) % cells.length];
    if (candidate !== undefined && !candidate.disabled) {
      candidate.focus();
      return;
    }
  }
}
