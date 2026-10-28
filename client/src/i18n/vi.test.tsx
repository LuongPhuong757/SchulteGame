// UI-02 guard: every visible word is Vietnamese and lives in vi.ts.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { vi } from './vi';
import { GameScreen } from '../screens/GameScreen';
import type { GameResult } from '../screens/GameScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { ResultScreen } from '../screens/ResultScreen';

afterEach(cleanup);

describe('source scan (UI-02)', () => {
  const files = import.meta.glob(
    ['../App.tsx', '../screens/*.tsx', '../components/*.tsx', '!../**/*.test.tsx'],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  it('scans the App, screens and components', () => {
    expect(Object.keys(files).length).toBeGreaterThanOrEqual(5);
  });

  it('contains no Vietnamese-letter text literal (Latin-1 Supplement .. Latin Extended-B, Extended Additional, combining marks)', () => {
    const offenders = Object.entries(files)
      .filter(([, source]) => /[\u0080-ɏ̀-ͯḀ-ỿ]/.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

const sampleResult: GameResult = {
  seed: 'abc',
  size: 4,
  rawMs: 12340,
  wrongCount: 1,
  penaltyMs: 2000,
  finalMs: 14340,
  taps: [],
};

const ENGLISH_UI_WORDS = new Set([
  'start', 'play', 'again', 'next', 'time', 'result', 'nickname', 'board', 'size', 'error',
  'quit', 'back', 'score', 'second', 'seconds', 'wrong', 'finish', 'done', 'loading', 'submit',
]);

describe('render check (UI-02)', () => {
  function visibleStrings(container: HTMLElement): string[] {
    const out: string[] = [container.textContent ?? ''];
    for (const el of Array.from(container.querySelectorAll('*'))) {
      for (const attr of ['aria-label', 'title', 'alt', 'placeholder']) {
        const value = el.getAttribute(attr);
        if (value !== null) out.push(value);
      }
    }
    return out;
  }

  function englishWordsIn(strings: string[]): string[] {
    return strings
      .flatMap((s) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u))
      .filter((word) => ENGLISH_UI_WORDS.has(word));
  }

  it('menu, game and result screens render no English UI word', () => {
    const menu = render(<MenuScreen initialNickname="" initialSize={4} onStart={() => undefined} />);
    const menuText = visibleStrings(menu.container);
    expect(menuText.join(' ').length).toBeGreaterThan(10);
    expect(englishWordsIn(menuText)).toEqual([]);
    cleanup();

    const game = render(<GameScreen seed="abc" size={4} onFinish={() => undefined} />);
    const gameText = visibleStrings(game.container);
    expect(englishWordsIn(gameText)).toEqual([]);
    cleanup();

    const result = render(
      <ResultScreen result={sampleResult} nickname="Lan Anh" onReplay={() => undefined} onChangeSize={() => undefined} />,
    );
    const resultText = visibleStrings(result.container);
    expect(resultText.join(' ')).toContain(vi.result.title);
    expect(englishWordsIn(resultText)).toEqual([]);
  });
});

describe('vi leaves', () => {
  function leaves(node: unknown, path: string, out: [string, unknown][]): void {
    if (typeof node === 'object' && node !== null) {
      for (const [k, v] of Object.entries(node)) leaves(v, `${path}.${k}`, out);
    } else {
      out.push([path, node]);
    }
  }

  it('every string is non-empty and every function returns a non-empty string', () => {
    const all: [string, unknown][] = [];
    leaves(vi, 'vi', all);
    expect(all.length).toBeGreaterThan(15);
    for (const [path, leaf] of all) {
      if (typeof leaf === 'string') {
        expect(leaf.trim().length, path).toBeGreaterThan(0);
      } else if (typeof leaf === 'function') {
        const text = (leaf as (...args: unknown[]) => unknown)(5, 2, 2);
        expect(typeof text, path).toBe('string');
        expect((text as string).trim().length, path).toBeGreaterThan(0);
      } else {
        throw new Error(`${path}: unexpected leaf type ${typeof leaf}`);
      }
    }
  });
});
