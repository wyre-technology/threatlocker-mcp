import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getClient, getCredentials, runWithCredentials } from '../utils/client.js';

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
});

describe('getCredentials', () => {
  it('returns null when both env vars are absent', () => {
    expect(getCredentials()).toBeNull();
  });

  it('returns null when only apiKey is set', () => {
    process.env.THREATLOCKER_API_KEY = 'key-only';
    expect(getCredentials()).toBeNull();
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

  it('omits baseUrl when no instance is set (SDK defaults to g)', async () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';

    const client = await getClient();
    expect(client.creds).toEqual({ apiKey: 'env-key', organizationId: 'env-org' });
    expect(client.creds).not.toHaveProperty('baseUrl');
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

  it('partial ALS credentials (missing organizationId) fall back to env', () => {
    process.env.THREATLOCKER_API_KEY = 'env-key';
    process.env.THREATLOCKER_ORGANIZATION_ID = 'env-org';

    // Simulate a partially-constructed object (shouldn't happen in prod, but guard it)
    runWithCredentials({ apiKey: 'scoped-key', organizationId: '' }, () => {
      // organizationId is falsy — should fall back to env
      const creds = getCredentials();
      expect(creds).toEqual({ apiKey: 'env-key', organizationId: 'env-org' });
    });
  });

  it('concurrent contexts do not contaminate each other', async () => {
    const results: Array<{ apiKey: string; organizationId: string } | null> = [];

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
