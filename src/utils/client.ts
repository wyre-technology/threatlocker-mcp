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

  _client = new ThreatLockerClient(creds);
  _credKey = key;
  logger.info('Created ThreatLocker API client');
  return _client;
}