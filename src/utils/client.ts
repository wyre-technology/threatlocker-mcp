// TODO: SDK not yet published - remove these comments when @wyre-technology/node-threatlocker@0.1.0 is available
// Expected to export ThreatLockerClient class with:
// - .computers resource
// - .computerGroups resource
// - .approvalRequests resource
// - .auditLog resource
// - .organizations resource

// @ts-expect-error pending SDK publish
import { ThreatLockerClient } from '@wyre-technology/node-threatlocker';
import { logger } from './logger.js';

let _client: any | null = null;
let _credKey: string | null = null;

interface Credentials {
  apiKey: string;
  organizationId: string;
}

export function getCredentials(): Credentials | null {
  const apiKey = process.env.THREATLOCKER_API_KEY;
  const organizationId = process.env.THREATLOCKER_ORGANIZATION_ID;
  if (!apiKey || !organizationId) {
    logger.warn('Missing credentials', { hasApiKey: !!apiKey, hasOrgId: !!organizationId });
    return null;
  }
  return { apiKey, organizationId };
}

export function resetClient(): void {
  _client = null;
  _credKey = null;
  logger.debug('Reset ThreatLocker client');
}

export async function getClient(): Promise<any> {
  const creds = getCredentials();
  if (!creds) throw new Error('No ThreatLocker API credentials configured. Set THREATLOCKER_API_KEY and THREATLOCKER_ORGANIZATION_ID.');

  const key = `${creds.apiKey}:${creds.organizationId}`;
  if (_client && _credKey === key) return _client;

  // TODO: Remove ts-expect-error when SDK is published
  // @ts-expect-error pending SDK publish
  _client = new ThreatLockerClient(creds);
  _credKey = key;
  logger.info('Created ThreatLocker API client');
  return _client;
}