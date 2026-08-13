/**
 * Vitest setup — minimal browser-global stubs for engine tests in node env.
 */

const storage = new Map<string, string>();

const localStorageStub = {
  getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
  setItem: (k: string, v: string) => void storage.set(k, String(v)),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => void storage.clear(),
  key: (i: number) => [...storage.keys()][i] ?? null,
  get length() {
    return storage.size;
  },
};

const g = globalThis as Record<string, unknown>;

g.localStorage = localStorageStub;
g.sessionStorage = { ...localStorageStub };

if (typeof g.window === 'undefined') {
  g.window = {
    localStorage: localStorageStub,
    location: { origin: 'http://localhost:5173' },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}
