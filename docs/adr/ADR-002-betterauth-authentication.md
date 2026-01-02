# ADR-002: BetterAuth Authentication

**Date:** 2025-12-01  
**Status:** Accepted

## Context

We need a secure, flexible authentication system that supports:

- Email/Password login (with verification)
- OAuth providers (Google, GitHub)
- Session management
- TypeScript support

## Options Considered

1. **NextAuth.js (Auth.js)**: Popular, but historically tied to Next.js. v5 is better but documentation can be fragmented.
2. **Clerk / Auth0**: Managed services. Easiest to implement but expensive at scale and less control over data.
3. **BetterAuth**: specific for TypeScript/framework-agnostic needs.
4. **Lucia Auth**: Excellent, flexible library, but requires more boilerplate.

## Decision

We chose **BetterAuth**.

## Consequences

### Positive

- **Type Safety**: Built with TypeScript in mind, offering excellent type inference.
- **Framework Agnostic**: Works perfectly with TanStack Start (unlike NextAuth which has some Next.js specifics).
- **Plugins**: Modular system to add features like 2FA or email verification.
- **Self-Hosted**: We own the data in our PostgreSQL database (no external vendor lock-in).

### Negative

- **Newer Library**: Less battle-tested than Auth0 or NextAuth.
- **Configuration**: Requires setting up mailer and database adapters manually.
