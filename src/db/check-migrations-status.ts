import { db } from './index';
import { sql } from 'drizzle-orm';

async function checkMigrationStatus() {
    try {
        console.log('Checking migration status...');
        const result = await db.execute(sql`SELECT * FROM "__drizzle_migrations"`);
        console.log('Migration History:');
        console.table(result);

        const tables = await db.execute(sql`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`);
        console.log('\nExisting Tables:');
        console.table(tables);
    } catch (error) {
        console.error('Error checking migration status:', error);
    } finally {
        process.exit(0);
    }
}

checkMigrationStatus();
