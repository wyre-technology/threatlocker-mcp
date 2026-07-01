import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCredentials, runWithCredentials } from '../utils/client.js';

const ORIG_ENV = { ...process.env };

beforeEach(() => {
  // Clean slate — remove ThreatLocker env vars
  delete process.env.THREATLOCKER_API_KEY;
  delete process.env.THREATLOCKER_ORGANIZATION_ID;
});

afterEach(() => {
  process.env.THREATLOCKER_API_KEY = ORIG_ENV.THREATLOCKER_API_KEY;
  process.env.THREATLOCKER_ORGANIZATION_ID = ORIG_ENV.THREATLOCKER_ORGANIZATION_ID;
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
