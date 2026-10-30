# Documentation

Welcome to the **TestingWithEkki** project documentation.

## Project Basics

- [**README.md**](../README.md): Quick start guide and project overview.
- [**LOCAL_DEVELOPMENT.md**](./LOCAL_DEVELOPMENT.md): Bun + local Workers/D1 workflow for macOS and Windows.
- [**CLOUDFLARE_MIGRATION.md**](./CLOUDFLARE_MIGRATION.md): Migration order, existing infrastructure inventory, and remaining production recovery work.
- [**CLOUDFLARE_CONTENT.md**](./CLOUDFLARE_CONTENT.md): Bundled content, route/cache policy, and remaining asset/OG work.
- [**CLOUDFLARE_OG.md**](./CLOUDFLARE_OG.md): Static share-card preparation, legacy query handling, and Workers rendering strategy.
- [**CLOUDFLARE_D1.md**](./CLOUDFLARE_D1.md): Type mappings, authentication persistence and atomic reward batches.
- [**CLOUDFLARE_DATA.md**](./CLOUDFLARE_DATA.md): Restricted PostgreSQL export, D1 import and complete reconciliation.
- [**CLOUDFLARE_OPERATIONS.md**](./CLOUDFLARE_OPERATIONS.md): Bindings, HTTP email, rate limits, CI/deploy and backups.
- [**CLOUDFLARE_READINESS.md**](./CLOUDFLARE_READINESS.md): Recorded validation evidence and outstanding release gates.
- [**CLOUDFLARE_CUTOVER.md**](./CLOUDFLARE_CUTOVER.md): Local/preview readiness, approved cutover, rollback and retirement.
- [**GLOSSARY.md**](./GLOSSARY.md): Definitions of terms used in the project.
- [**CHANGELOG.md**](./CHANGELOG.md): History of changes and versions.

## Architecture & Design

- [**PRD.md**](./PRD.md): **Product Requirements Document**. The "What" and "Why" of the platform.
- [**TDD.md**](./TDD.md): **Technical Design Document**. The "How," covering architecture, stack, and systems.
- [**ARCHITECTURE.md**](./ARCHITECTURE.md): **Challenge Executor Architecture**. How user code is executed and validated.
- [**ERD.md**](./ERD.md): **Entity Relationship Diagram**. Database schema and relationships.
- [**app_flows.md**](./app_flows.md): Visual diagrams of user journeys and system flows.
- [**API.md**](./API.md): API reference documentation.
- [**github_issues.md**](./github_issues.md): Breakdown of tasks and issues.
- [**github_issues.md**](./github_issues.md): Breakdown of tasks and issues.

## Architecture Decisions

- [**ADR Index**](./adr/README.md): Log of all key architectural decisions.
  - [ADR-001: TanStack Start Framework](./adr/ADR-001-tanstack-start-framework.md)
  - [ADR-002: BetterAuth Authentication](./adr/ADR-002-betterauth-authentication.md)
  - [ADR-003: Client-Side Playwright Shim](./adr/ADR-003-client-side-code-execution.md)
  - [ADR-004: Drizzle ORM](./adr/ADR-004-drizzle-orm.md)
  - [ADR-005: PostgreSQL Database](./adr/ADR-005-postgresql-database.md)
  - [ADR-006: Monaco Editor](./adr/ADR-006-monaco-editor.md)

## Security

- [**SECURITY_TESTING.md**](../SECURITY_TESTING.md): Guide to security testing practices for this app.
