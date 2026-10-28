import { isBoardSize, type BoardSize } from './config';

/** FNV-1a 32-bit over UTF-16 code units, returned unsigned. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG, yields floats in [0, 1). */
export function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic permutation of 1..size² for a seed (client/server contract). */
export function generateBoard(seed: string, size: BoardSize): number[] {
  if (!isBoardSize(size)) {
    throw new RangeError(`Unsupported board size: ${String(size)}`);
  }
  const n = size * size;
  const a = Array.from({ length: n }, (_, i) => i + 1);
  const rand = mulberry32(hashSeed(seed));
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
