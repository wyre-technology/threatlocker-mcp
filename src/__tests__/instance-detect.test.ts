import { describe, it, expect, afterEach, vi } from 'vitest';
import { detectInstance, clearInstanceCache, PORTAL_INSTANCES } from '../utils/instance-detect.js';

afterEach(() => {
  vi.unstubAllGlobals();
  clearInstanceCache();
});

// ThreatLocker signals "key does not exist on this instance" with HTTP 440;
// the one instance the key was created on answers 200.
function stubFetchAccepting(accepted: string): string[] {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      calls.push(String(url));
      const ok = String(url).includes(`portalapi.${accepted}.threatlocker.com`);
      return { ok, status: ok ? 200 : 440 } as Response;
    }),
  );
  return calls;
}

describe('detectInstance', () => {
  it('returns the instance that accepts the API key', async () => {
    stubFetchAccepting('h');
    await expect(detectInstance('key-1')).resolves.toBe('h');
  });

  it('probes every known portal instance', async () => {
    const calls = stubFetchAccepting('h');
    await detectInstance('key-2');
    for (const i of PORTAL_INSTANCES) {
      expect(calls.some((u) => u.includes(`portalapi.${i}.threatlocker.com`))).toBe(true);
    }
  });

  it('caches detection per API key so repeat calls skip the probes', async () => {
    stubFetchAccepting('e');
    await detectInstance('key-3');
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsAfterFirst = fetchMock.mock.calls.length;
    await detectInstance('key-3');
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('throws a descriptive error when every instance rejects the key', async () => {
    stubFetchAccepting('none-of-them');
    await expect(detectInstance('bad-key')).rejects.toThrow(/rejected by all/i);
  });

  it('still detects when probes to other instances throw network errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        if (String(url).includes('portalapi.c.threatlocker.com')) {
          return { ok: true, status: 200 } as Response;
        }
        throw new Error('fetch failed');
      }),
    );
    await expect(detectInstance('key-4')).resolves.toBe('c');
  });
});
