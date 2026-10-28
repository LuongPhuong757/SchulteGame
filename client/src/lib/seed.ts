/** 16 lowercase hex chars from crypto-random bytes. Seed stays a string so Phase 2 can swap in a server token. */
export function newSeed(): string {
  const words = crypto.getRandomValues(new Uint32Array(2));
  return Array.from(words, (w) => w.toString(16).padStart(8, '0')).join('');
}
