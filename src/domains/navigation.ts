import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainName, NavigationState } from '../utils/types.js';

const sessionStates = new Map<string, NavigationState>();

export function getState(sessionId: string = 'default'): NavigationState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, { currentDomain: null });
  }
  return sessionStates.get(sessionId)!;
}

export const DOMAINS: DomainName[] = ['computers', 'computer_groups', 'approval_requests', 'audit_log', 'organizations'];

export function getNavigationTools(): Tool[] {
  return [
    {
      name: 'threatlocker_navigate',
      description: `Navigate to a domain to see its tools. Domains: ${DOMAINS.join(', ')}.
- computers: list/get computers, get checkins
- computer_groups: list computer groups, dropdown options
- approval_requests: list/get approval requests, pending count, permit applications
- audit_log: search audit logs, get audit entries, file history
- organizations: list child organizations, get auth key, move computer options`,
      inputSchema: {
        type: 'object' as const,
        properties: {
          domain: {
            type: 'string',
            enum: DOMAINS,
            description: 'The domain to navigate to',
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'threatlocker_status',
      description: 'Check ThreatLocker API connection status and available domains.',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ];
}

export function getBackTool(): Tool {
  return {
    name: 'threatlocker_back',
    description: 'Return to the domain navigation menu.',
    inputSchema: { type: 'object' as const, properties: {} },
  };
}