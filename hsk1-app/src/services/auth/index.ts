type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const SESSION_KEY = 'hsk_portal_unlocked_v2';
const SESSION_ALIASES = [
  'hsk1_ranteacher_unlocked',
  'hsk_portal_unlocked',
  'hsk2_ranteacher_unlocked',
  'hsk3_ranteacher_unlocked',
  'hsk4_upper_ranteacher_unlocked',
  'hsk4_lower_ranteacher_unlocked',
] as const;
const PASSWORD_HASH = '5b363ff1986142a6f34d3e259948aa38ec4773ad293a0cc03f2357877433a0c5';
const PASSWORD_SIGNATURE = '52.61.6e.6c.61.6f.73.68.69.6d.65.69.6d.65.69';

async function acceptsPassword(password: string): Promise<boolean> {
  let raw: string;
  try {
    raw = password.trim();
  } catch {
    return false;
  }

  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      return hash === PASSWORD_HASH;
    }
  } catch {
    // The original gate also supports browsers without a working SHA-256 helper.
  }
  return [...raw].map(character => character.codePointAt(0)!.toString(16)).join('.') === PASSWORD_SIGNATURE;
}

/** Tab-session access only; legacy keys are compatibility outputs, never authority. */
export function createSessionAuth(storage: SessionStorage) {
  let unlockedInMemory = false;
  const hasPersistedSession = (): boolean => {
    try {
      return storage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  };

  return {
    isUnlocked(): boolean {
      return unlockedInMemory || hasPersistedSession();
    },

    async unlock(password: string): Promise<{accepted: boolean; persisted: boolean}> {
      if (!await acceptsPassword(password)) return {accepted: false, persisted: false};

      // A denied storage write must not prevent valid access in this tab.
      unlockedInMemory = true;
      let persisted = true;
      for (const key of [SESSION_KEY, ...SESSION_ALIASES]) {
        try {
          storage.setItem(key, '1');
        } catch {
          persisted = false;
        }
      }
      return {accepted: true, persisted: persisted && hasPersistedSession()};
    },
  };
}
