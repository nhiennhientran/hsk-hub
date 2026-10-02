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

type PasswordCheck = 'accepted' | 'rejected' | 'unsupported-crypto';

async function checkPassword(password: string): Promise<PasswordCheck> {
  let raw: string;
  try {
    raw = password.trim();
  } catch {
    return 'rejected';
  }
  if (!raw) return 'rejected';

  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return 'unsupported-crypto';
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return hash === PASSWORD_HASH ? 'accepted' : 'rejected';
  } catch {
    // Never substitute a reversible verifier when secure hashing is unavailable.
    return 'unsupported-crypto';
  }
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

    async unlock(password: string): Promise<{accepted: boolean; persisted: boolean; reason?: 'unsupported-crypto'}> {
      const result = await checkPassword(password);
      if (result === 'unsupported-crypto') return {accepted: false, persisted: false, reason: result};
      if (result !== 'accepted') return {accepted: false, persisted: false};

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
