import { db } from '@/db';
import { tutorials, challenges } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

async function seedPoCTranslation() {
    console.log('🌱 Seeding PoC Translations...');

    // 1. Translate Tutorial: CSS Selectors for QA Engineers
    await db.update(tutorials)
        .set({
            title: sql`title || '{"id": "Pemilih CSS untuk QA Engineer"}'::jsonb`,
            description: sql`description || '{"id": "Panduan untuk menemukan elemen secara efisien untuk pengujian otomatis."}'::jsonb`,
        })
        .where(eq(tutorials.slug, 'css-selectors-for-qa'));

    console.log('✅ Translated Tutorial: css-selectors-for-qa');

    // 2. Translate Challenge: ID & Class Selectors
    await db.update(challenges)
        .set({
            title: sql`title || '{"id": "Pemilih ID & Class"}'::jsonb`,
            description: sql`description || '{"id": "Targetkan elemen berdasarkan ID unik dan class yang dapat digunakan kembali."}'::jsonb`,
        })
        .where(eq(challenges.slug, 'css-selector-101-id-class'));

    console.log('✅ Translated Challenge: id-class-selectors');

    console.log('✨ PoC Translations Seeded!');
    process.exit(0);
}

seedPoCTranslation().catch((err) => {
    console.error('❌ Failed to seed translations:', err);
    process.exit(1);
});
