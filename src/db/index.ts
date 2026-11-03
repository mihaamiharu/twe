import { drizzle } from 'drizzle-orm/d1';
import { closeRuntime, getRuntimeEnv } from '#platform';
import * as schema from './schema';
import type { RuntimeEnv } from '@/runtime/env';

const databases = new WeakMap<
  RuntimeEnv['DB'],
  ReturnType<typeof createDatabase>
>();

function createDatabase(binding: RuntimeEnv['DB']) {
  return drizzle(binding, { schema });
}

export function getDatabase() {
  const binding = getRuntimeEnv().DB;
  if (!binding) throw new Error('D1 DB binding is missing.');
  let database = databases.get(binding);
  if (!database) {
    database = createDatabase(binding);
    databases.set(binding, database);
  }
  return database;
}

export type Database = ReturnType<typeof createDatabase>;

// Binding lookup stays lazy while shared helpers retain a typed import.
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDatabase();
    const value: unknown = Reflect.get(database, property);
    if (typeof value === 'function')
      return (...args: unknown[]): unknown => {
        const result: unknown = Reflect.apply(value, database, args);
        return result;
      };
    return value;
  },
});

export * from './schema';
export const closeDatabase = closeRuntime;
