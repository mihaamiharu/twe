# ADR-005: PostgreSQL Database

**Date:** 2025-12-01  
**Status:** Accepted

## Context

We need a reliable, relational database to store users, content (tutorials/challenges), and progress data.

## Decision

We chose **PostgreSQL**.

## Rationale

PostgreSQL is the industry standard for open-source relational databases. It supports advanced features we might need later (JSONB for test cases, full-text search, complex indexing).

## Consequences

- **Reliability**: ACID compliance ensures data integrity for user progress and authentication.
- **Flexibility**: JSONB columns allow storing flexible challenge metadata without strictly defining every field in a separate table.
- **Portability**: Supported by every major cloud provider (AWS RDS, DigitalOcean, Railway, Supabase).
