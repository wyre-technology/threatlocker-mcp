import type { DomainName, DomainHandler } from '../utils/types.js';

const domainCache = new Map<DomainName, DomainHandler>();

export async function getDomainHandler(domain: DomainName): Promise<DomainHandler> {
  const cached = domainCache.get(domain);
  if (cached) return cached;

  let handler: DomainHandler;
  switch (domain) {
    case 'computers': {
      const { computersHandler } = await import('./computers.js');
      handler = computersHandler;
      break;
    }
    case 'computer_groups': {
      const { computerGroupsHandler } = await import('./computer_groups.js');
      handler = computerGroupsHandler;
      break;
    }
    case 'approval_requests': {
      const { approvalRequestsHandler } = await import('./approval_requests.js');
      handler = approvalRequestsHandler;
      break;
    }
    case 'audit_log': {
      const { auditLogHandler } = await import('./audit_log.js');
      handler = auditLogHandler;
      break;
    }
    case 'organizations': {
      const { organizationsHandler } = await import('./organizations.js');
      handler = organizationsHandler;
      break;
    }
    default:
      throw new Error(`Unknown domain: ${domain}`);
  }

  domainCache.set(domain, handler);
  return handler;
}