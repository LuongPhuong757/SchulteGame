// On-device nickname persistence (ID-02). Never throws: Safari private mode or
// blocked storage must leave the app working with no persistence (Pitfall 4).
import { validateNickname } from '@schulte/shared';

export const NICKNAME_STORAGE_KEY = 'schulte:nickname' as const;

/** The stored nickname, or null when missing, invalid (dropped) or storage is unavailable. */
export function loadNickname(): string | null {
  let stored: string | null;
  try {
    stored = localStorage.getItem(NICKNAME_STORAGE_KEY);
  } catch {
    return null;
  }
  if (stored === null) return null;

  const result = validateNickname(stored);
  if (!result.ok) {
    try {
      localStorage.removeItem(NICKNAME_STORAGE_KEY);
    } catch {
      // best effort
    }
    return null;
  }
  return result.value;
}

/** Validates, then stores only the normalized value. False when invalid or storage fails. */
export function saveNickname(raw: string): boolean {
  const result = validateNickname(raw);
  if (!result.ok) return false;
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, result.value);
    return true;
  } catch {
    return false;
  }
}
