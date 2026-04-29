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