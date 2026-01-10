import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please check your .env file.',
  );
}

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL;

// For query purposes
const queryClient = postgres(connectionString);

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
