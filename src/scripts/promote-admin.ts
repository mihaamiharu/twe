import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function promoteToAdmin() {
    const email = 'ekkisyam2310@gmail.com';
    console.log(`🚀 Promoting ${email} to ADMIN...`);

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.error('❌ User not found');
            return;
        }

        await db
            .update(users)
            .set({
                role: 'ADMIN',
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

        console.log(`✅ ${email} is now an ADMIN!`);
    } catch (error) {
        console.error('❌ Promotion Failed:', error);
    }
}

promoteToAdmin().then(() => process.exit(0));
