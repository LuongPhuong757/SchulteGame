/** Vietnamese-style time: "12,34" or "1:05,43" (decimal comma; unit word lives in vi.ts). */
export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`Invalid time: ${String(ms)}`);
  }
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const csText = String(cs).padStart(2, '0');
  if (totalSec < 60) return `${totalSec},${csText}`;
  const min = Math.floor(totalSec / 60);
  const sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec},${csText}`;
}
