## [1.0.2](https://github.com/wyre-technology/threatlocker-mcp/compare/v1.0.1...v1.0.2) (2026-05-04)


### Bug Fixes

* **add-to-project:** call shared reusable workflow ([#3](https://github.com/wyre-technology/threatlocker-mcp/issues/3)) ([eb9011c](https://github.com/wyre-technology/threatlocker-mcp/commit/eb9011c077b5cc7d76d3ffc54f673bcef59ce5b3))

## [1.0.1](https://github.com/wyre-technology/threatlocker-mcp/compare/v1.0.0...v1.0.1) (2026-05-01)


### Bug Fixes

* **docker:** add _authToken line to .npmrc ([e1d14a8](https://github.com/wyre-technology/threatlocker-mcp/commit/e1d14a8a2113920350cc8019e56d88a69f7fa654))

# 1.0.0 (2026-05-01)


### Features

* initial MCP server scaffold for ThreatLocker ([666e0b0](https://github.com/wyre-technology/threatlocker-mcp/commit/666e0b0fd3ff1e473099641532f52ce878a09e72))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial MCP server scaffold for ThreatLocker Portal API
- Support for computers domain (list, get, checkins)
- Support for computer groups domain (list, dropdown)
- Support for approval requests domain (list, get, pending count, permit applications)
- Support for audit log domain (search, get, file history)
- Support for organizations domain (list children, get auth key, move computers)
- Decision-tree navigation with `threatlocker_navigate` tool
- Gateway mode for multi-tenant deployments
- Elicitation infrastructure for interactive prompts
- Docker support with production-ready configuration
- Comprehensive logging and error handling
- TypeScript strict mode for type safety
