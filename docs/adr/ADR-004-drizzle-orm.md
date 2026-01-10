# ADR-004: Drizzle ORM

**Date:** 2025-12-01  
**Status:** Accepted

## Context

We need an Object-Relational Mapping (ORM) tool to interact with our PostgreSQL database. It should provide type safety, migration management, and good performance.

## Options Considered

1. **Prisma**: Very popular, excellent DX.
   - _Cons:_ Heavy runtime payload, "magic" behavior, schema limitations.
2. **TypeORM**: Mature, decorator-based.
   - _Cons:_ Issues with complex relations, larger bundle size.
3. **Drizzle ORM**: Newer, "SQL-like" typescript ORM.
   - _Pros:_ Lightweight (zero runtime dependencies), extremely fast, close to SQL metal.
4. **Raw SQL (pg)**: Maximum control.
   - _Cons:_ No type safety, maintenance burden.

## Decision

We chose **Drizzle ORM**.

## Consequences

### Positive

- **Performance**: Zero runtime overhead means faster serverless/edge execution (if needed).
- **Control**: Queries look like SQL, making it easier to optimize.
- **Migrations**: `drizzle-kit` provides a robust migration workflow.
- **Type Safety**: Best-in-class inference of return types.

### Negative

- **Verbosity**: Defining relations and queries is more verbose than Prisma's simplistic API.
- **Ecosystem**: Smaller plugin ecosystem than Prisma.
