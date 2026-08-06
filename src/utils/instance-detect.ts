import { createHash } from 'node:crypto';
import { logger } from './logger.js';

/**
 * ThreatLocker portal-instance auto-detection.
 *
 * Portals are sharded into lettered instances (portal.b … portal.h) and an
 * API key only exists on the instance it was created on — every other
 * instance answers HTTP 440. When a tenant doesn't supply their instance,
 * probing all of them with the key finds the right one.
 */

export const PORTAL_INSTANCES = ['g', 'b', 'c', 'd', 'e', 'f', 'h'] as const;

const PROBE_PATH = '/portalapi/ApprovalRequest/ApprovalRequestGetCount';
const PROBE_TIMEOUT_MS = 8000;

// A key's home instance never changes, so detection is cached for the process
// lifetime — keyed by key hash so raw keys never sit in a long-lived map.
const cache = new Map<string, string>();

export function clearInstanceCache(): void {
  cache.clear();
}

export async function detectInstance(apiKey: string): Promise<string> {
  const cacheKey = createHash('sha256').update(apiKey).digest('hex');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const probes = PORTAL_INSTANCES.map(async (instance) => {
    const res = await fetch(`https://portalapi.${instance}.threatlocker.com${PROBE_PATH}`, {
      headers: { Authorization: apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return instance;
  });

  try {
    const instance = await Promise.any(probes);
    cache.set(cacheKey, instance);
    logger.info('Auto-detected ThreatLocker portal instance', { instance });
    return instance;
  } catch {
    throw new Error(
      'Could not auto-detect the ThreatLocker portal instance: the API key was ' +
        'rejected by all portal instances (b–h). Verify the API key, or set ' +
        'the portal instance explicitly.',
    );
  }
}
