import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Check if DATABASE_URL or TEST_DATABASE_URL is set
if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Neither DATABASE_URL nor TEST_DATABASE_URL environment variable is set. Please check your environment configuration.',
  );
}

// Create PostgreSQL connection
const connectionString = (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) 
  ? process.env.TEST_DATABASE_URL 
  : process.env.DATABASE_URL!;

// Detect if using Supabase (requires prepare: false for PgBouncer)
const isSupabase = connectionString.includes('supabase.com');

// For query purposes
// Supabase uses PgBouncer in transaction mode which doesn't support prepared statements
const queryClient = postgres(connectionString, {
  prepare: !isSupabase,
});

// Create Drizzle database instance with schema
export const db = drizzle(queryClient, { schema });

// Export schema for use in other files
export * from './schema';

// Helper function to close database connection (useful for scripts and testing)
export async function closeDatabase() {
  await queryClient.end();
}

// Type definitions for better TypeScript support
export type Database = typeof db;
