// TODO: SDK not yet published - remove these comments when @wyre-technology/node-threatlocker@0.1.0 is available
// Expected to export ThreatLockerClient class with:
// - .computers resource
// - .computerGroups resource
// - .approvalRequests resource
// - .auditLog resource
// - .organizations resource

// @ts-expect-error pending SDK publish
import { ThreatLockerClient } from '@wyre-technology/node-threatlocker';
import { AsyncLocalStorage } from 'node:async_hooks';
import { logger } from './logger.js';

export interface Credentials {
  apiKey: string;
  organizationId: string;
}

// Request-scoped credential store. In gateway mode the HTTP layer runs each
// request inside runWithCredentials({apiKey, organizationId}); getCredentials()
// reads it. Falls back to process.env for stdio/single-tenant mode.
const credStore = new AsyncLocalStorage<Credentials>();

export function runWithCredentials<T>(creds: Credentials, fn: () => T): T {
  return credStore.run(creds, fn);
}

export function getCredentials(): Credentials | null {
  const scoped = credStore.getStore();
  if (scoped?.apiKey && scoped?.organizationId) return scoped;

  const apiKey = process.env.THREATLOCKER_API_KEY;
  const organizationId = process.env.THREATLOCKER_ORGANIZATION_ID;
  if (!apiKey || !organizationId) {
    logger.warn('Missing credentials', { hasApiKey: !!apiKey, hasOrgId: !!organizationId });
    return null;
  }
  return { apiKey, organizationId };
}

// Constructs a client from the request-scoped (or env) credentials. The client
// is cheap and holds no shared mutable state, so we build one per call — never
// a process-global singleton.
export async function getClient(): Promise<any> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'No ThreatLocker API credentials configured. Set THREATLOCKER_API_KEY and THREATLOCKER_ORGANIZATION_ID.',
    );
  }
  logger.info('Created ThreatLocker API client');
  return new ThreatLockerClient(creds);
}
