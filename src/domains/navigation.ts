import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainName } from '../utils/types.js';

export const DOMAINS: DomainName[] = ['computers', 'computer_groups', 'approval_requests', 'audit_log', 'organizations'];

/**
 * Domain metadata for navigation help
 */
const domainDescriptions: Record<DomainName, string> = {
  computers: "Computer management - list/get computers, get check-ins, and device information",
  computer_groups: "Computer group management - list computer groups and dropdown options",
  approval_requests: "Approval request management - list/get approval requests, pending count, permit applications",
  audit_log: "Audit log management - search audit logs, get audit entries, file history",
  organizations: "Organization management - list child organizations, get auth key, move computer options",
};

export function getNavigationTools(): Tool[] {
  return [
    {
      name: 'threatlocker_navigate',
      description: 'Discover available ThreatLocker tools by domain. Returns tool names and descriptions for the selected domain. All tools are callable at any time — this is a help/discovery aid, not a prerequisite.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          domain: {
            type: 'string',
            enum: DOMAINS,
            description: `The domain to explore:
- computers: ${domainDescriptions.computers}
- computer_groups: ${domainDescriptions.computer_groups}
- approval_requests: ${domainDescriptions.approval_requests}
- audit_log: ${domainDescriptions.audit_log}
- organizations: ${domainDescriptions.organizations}`,
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'threatlocker_status',
      description: 'Show credentials status and available domains',
      inputSchema: { type: 'object' as const, properties: {} },
    },
  ];
}

