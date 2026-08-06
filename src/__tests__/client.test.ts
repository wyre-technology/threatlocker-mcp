import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getClient, getCredentials, runWithCredentials } from '../utils/client.js';
import { clearInstanceCache } from '../utils/instance-detect.js';

const ORIG_ENV = { ...process.env };

function restoreEnv(key: string): void {
  if (ORIG_ENV[key] === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = ORIG_ENV[key];
  }
}

beforeEach(() => {
  // Clean slate — remove ThreatLocker env vars
  delete process.env.THREATLOCKER_API_KEY;
  delete process.env.THREATLOCKER_ORGANIZATION_ID;
  delete process.env.THREATLOCKER_INSTANCE;
});

afterEach(() => {
  restoreEnv('THREATLOCKER_API_KEY');
  restoreEnv('THREATLOCKER_ORGANIZATION_ID');
  restoreEnv('THREATLOCKER_INSTANCE');
  vi.unstubAllGlobals();
  clearInstanceCache();
});

// Auto-detect probes hit the network; stub fetch so `h` is the accepting instance.
function stubDetectionAccepting(accepted: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL) => {
      const ok = String(url).includes(`portalapi.${accepted}.threatlocker.com`);
      return { ok, status: ok ? 200 : 440 } as Response;
    }),
  );
}

describe('getCredentials', () => {
  it('returns null when both env vars are absent', () => {
    expect(getCredentials()).toBeNull();
  });

  it('returns apiKey-only credentials when organizationId is absent (API defaults to the key\'s primary org)', () => {
    process.env.THREATLOCKER_API_KEY = 'key-only';
    const creds = getCredentials();
    expect(creds?.apiKey).toBe('key-only');
    expect(creds?.organizationId).toBeUndefined();
  });

  it('returns null when only organizationId is set', () => {
    process.env.THREATLOCKER_ORGANIZATION_ID = 'org-only';
    expect(getCredentials()).toBeNull();
  });

  it('returns env-based credentials when both vars are present', () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    const creds = getCredentials();
    expect(creds).toEqual({ apiKey: 'env-key', organizationId: 'env-org' });
  });

  it('picks up the portal instance from THREATLOCKER_INSTANCE', () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    process.env.THREATLOCKER_INSTANCE = 'e';
    const creds = getCredentials();
    expect(creds?.instance).toBe('e');
  });
});

describe('getClient portal-instance routing', () => {
  it('builds an instance-specific baseUrl when instance is set', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    process.env.THREATLOCKER_INSTANCE = 'e';

    const client = await getClient();
    expect(client.creds).toEqual({
      apiKey: 'env-key',
      organizationId: 'env-org',
      baseUrl: 'https://portalapi.e.threatlocker.com/portalapi',
    });
  });

  it('auto-detects the portal instance when none is set', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    stubDetectionAccepting('h');

    const client = await getClient();
    expect(client.creds.baseUrl).toBe('https://portalapi.h.threatlocker.com/portalapi');
  });

  it('does not probe when an instance is explicitly provided', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    process.env.THREATLOCKER_INSTANCE = 'e';
    const probe = vi.fn(async () => {
      throw new Error('should not be called');
    });
    vi.stubGlobal('fetch', probe);

    await getClient();
    expect(probe).not.toHaveBeenCalled();
  });

  it('builds a client without organizationId when only the API key is configured', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    stubDetectionAccepting('g');

    const client = await getClient();
    expect(client.creds.apiKey).toBe('env-key');
    expect(client.creds).not.toHaveProperty('organizationId');
  });

  it('rejects a malformed instance instead of silently using g', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';
    process.env.THREATLOCKER_INSTANCE = 'evil.com/#';

    await expect(getClient()).rejects.toThrow(/Invalid ThreatLocker portal instance/);
  });
});

describe('runWithCredentials + getCredentials ALS precedence', () => {
  it('ALS-scoped credentials override env vars', () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';

    runWithCredentials({ apiKey: 'scoped-key', organizationId: 'scoped-org' }, () => {
      const creds = getCredentials();
      expect(creds).toEqual({ apiKey: 'scoped-key', organizationId: 'scoped-org' });
    });
  });

  it('ALS context does not leak outside runWithCredentials', () => {
    runWithCredentials({ apiKey: 'leaked-key', organizationId: 'leaked-org' }, () => {
      // inside: scoped
      expect(getCredentials()).toEqual({ apiKey: 'leaked-key', organizationId: 'leaked-org' });
    });

    // outside: should fall back to env (null here because no env vars set)
    expect(getCredentials()).toBeNull();
  });

  it('ALS credentials with an empty organizationId still win over env (org treated as unset)', () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';

    // Gateway mode sends apiKey without organizationId when the customer left
    // the org field blank — those credentials are valid (the API defaults to
    // the key's primary org) and must NOT fall through to another tenant's env.
    runWithCredentials({ apiKey: 'scoped-key', organizationId: '' }, () => {
      const creds = getCredentials();
      expect(creds?.apiKey).toBe('scoped-key');
      expect(creds?.organizationId).toBeUndefined();
    });
  });

  it('ALS credentials without organizationId at all are accepted', () => {
    runWithCredentials({ apiKey: 'scoped-key' }, () => {
      const creds = getCredentials();
      expect(creds?.apiKey).toBe('scoped-key');
      expect(creds?.organizationId).toBeUndefined();
    });
  });

  it('concurrent contexts do not contaminate each other', async () => {
    const results: Array<{ apiKey: string; organizationId?: string } | null> = [];

    const task = (apiKey: string, organizationId: string, delayMs: number) =>
      new Promise<void>((resolve) => {
        runWithCredentials({ apiKey, organizationId }, () => {
          setTimeout(() => {
            results.push(getCredentials());
            resolve();
          }, delayMs);
        });
      });

    // Start two overlapping async tasks with different credentials
    await Promise.all([
      task('key-alpha', 'org-alpha', 20),
      task('key-beta', 'org-beta', 5),
    ]);

    // beta finishes first (5ms), then alpha (20ms)
    expect(results[0]).toEqual({ apiKey: 'key-beta', organizationId: 'org-beta' });
    expect(results[1]).toEqual({ apiKey: 'key-alpha', organizationId: 'org-alpha' });
  });
});
