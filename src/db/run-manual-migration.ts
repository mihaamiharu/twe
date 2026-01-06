import { db } from './index';
import { sql } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';

async function runManualMigration() {
    console.log('🚀 Running manual migration for JSONB localization...\n');

    const migrationPath = join(process.cwd(), 'drizzle/migrations/0004_broken_wong.sql');
    const sqlContent = await readFile(migrationPath, 'utf-8');

    // Split statements by breakpoint
    const statements = sqlContent.split('--> statement-breakpoint');

    try {
        for (let statement of statements) {
            statement = statement.trim();
            if (!statement) continue;

            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.execute(sql.raw(statement));
        }
        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runManualMigration();
