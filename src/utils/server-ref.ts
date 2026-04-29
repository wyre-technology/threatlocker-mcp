import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

let _serverRef: Server | null = null;

export function setServerRef(server: Server): void {
  _serverRef = server;
}

export function getServerRef(): Server | null {
  return _serverRef;
}