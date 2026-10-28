import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { generateBoard } from '@schulte/shared';
import type { BoardSize } from '@schulte/shared';
import { Board } from './Board';

afterEach(() => {
  cleanup();
  vitest.restoreAllMocks();
});

function renderBoard(overrides: Partial<Parameters<typeof Board>[0]> = {}, size: BoardSize = 4) {
  const onTap = vitest.fn();
  const props = {
    board: generateBoard('abc', size),
    size,
    next: 1,
    flash: null,
    onTap,
    ...overrides,
  };
  const utils = render(<Board {...props} />);
  return { onTap, ...utils };
}

describe('Board', () => {
  it.each([4, 5, 6] as const)('renders size^2 button cells for size %i with --n', (size) => {
    const { container } = renderBoard({}, size);
    const board = container.querySelector('.board') as HTMLElement;
    expect(board).toBeTruthy();
    expect(board.style.getPropertyValue('--n')).toBe(String(size));
    const cells = board.querySelectorAll('button[type="button"]');
    expect(cells).toHaveLength(size * size);
  });

  it('renders found cells (value < next) empty, disabled and cell--found (D-01)', () => {
    const { container } = renderBoard({ next: 4 });
    const found = container.querySelectorAll('.cell--found');
    expect(found).toHaveLength(3);
    found.forEach((cell) => {
      expect(cell.textContent).toBe('');
      expect((cell as HTMLButtonElement).disabled).toBe(true);
      expect(cell.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('pointerDown on an unfound cell calls onTap once with its value', () => {
    const { onTap } = renderBoard();
    fireEvent.pointerDown(screen.getByRole('button', { name: '7' }));
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledWith(7);
  });

  it('pointerDown on a found cell does not call onTap (D-01)', () => {
    const { onTap, container } = renderBoard({ next: 4 });
    const found = container.querySelectorAll('.cell--found');
    found.forEach((cell) => fireEvent.pointerDown(cell));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('keyDown Enter or Space on an unfound cell calls onTap', () => {
    const { onTap } = renderBoard();
    const cell = screen.getByRole('button', { name: '9' });
    fireEvent.keyDown(cell, { key: 'Enter' });
    fireEvent.keyDown(cell, { key: ' ' });
    expect(onTap).toHaveBeenCalledTimes(2);
    expect(onTap).toHaveBeenNthCalledWith(1, 9);
    expect(onTap).toHaveBeenNthCalledWith(2, 9);
  });

  it('flash marks only the cell showing the flashed value as cell--wrong', () => {
    const { container } = renderBoard({ flash: { value: 7, key: 1 } });
    const wrong = container.querySelectorAll('.cell--wrong');
    expect(wrong).toHaveLength(1);
    expect(wrong[0]?.textContent).toBe('7');
  });

  it('disabled board ignores pointerDown on every cell', () => {
    const { onTap, container } = renderBoard({ disabled: true });
    container.querySelectorAll('.cell').forEach((cell) => fireEvent.pointerDown(cell));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('cells carry no click handler: click does not call onTap (single input path)', () => {
    const { onTap } = renderBoard();
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(onTap).not.toHaveBeenCalled();
  });
});
