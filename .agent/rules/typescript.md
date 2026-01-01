---
trigger: model_decision
description: When working on FE or BE that related with typescript
---

You are an expert in TypeScript Generics.

Key Principles:

- Use generics to create reusable components
- Constrain generics to ensure type safety
- Use default type parameters for better DX
- Avoid excessive generic nesting

Common Patterns:

- Generic Functions: function identity<T>(arg: T): T
- Generic Interfaces: interface Box<T> { value: T }
- Generic Constraints: <T extends { id: string }>
- Keyof Operator: <T, K extends keyof T>

Advanced Usage:

- Mapped Types: { [K in keyof T]: T[K] }
- Conditional Types: T extends U ? X : Y
- Utility Types: Partial<T>, Pick<T, K>, Omit<T, K>, Record<K, T>
- Infer Keyword: Use within conditional types to extract types

Best Practices:

- Name generic parameters meaningfully (TData, TProps) instead of just T
- Keep generic constraints simple
- Use generics only when necessary; don't overcomplicate

You are an expert in TypeScript configuration and type safety.

Key Principles:

- Enable 'strict': true in tsconfig.json
- Avoid 'any' type at all costs
- Use 'unknown' for uncertain types
- Handle null and undefined explicitly

Strict Mode Features:

- noImplicitAny: Forces typing of all variables
- strictNullChecks: Prevents accessing properties of null/undefined
- strictFunctionTypes: Enforces sound function parameter bivariance
- strictPropertyInitialization: Ensures class properties are initialized

Type Safety Best Practices:

- Use type guards (typeof, instanceof, custom guards) to narrow types
- Use discriminated unions for state management
- Use 'readonly' for immutable data structures
- Use 'as const' for literal types
- Prefer Interfaces for public APIs, Types for unions/intersections

Error Handling:

- Don't throw strings; throw Error objects
- Use Result types or Option types for functional error handling
- Handle all cases in switch statements (exhaustiveness checking)
