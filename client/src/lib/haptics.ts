/**
 * Feature-detected vibration (BOARD-03). Supplementary only: iOS Safari has no
 * navigator.vibrate, so the red flash must always stand on its own (T-03-02).
 * Returns true only if the API existed and was called without throwing.
 */
export function vibrate(ms: number): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false;
  }
  try {
    navigator.vibrate(ms);
    return true;
  } catch {
    return false;
  }
}
