import { db } from '../db';
import { users, progress, challenges } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function setupStreak() {
    const email = 'ekkisyam2310@gmail.com';
    console.log(`🚀 Setting up streak for ${email}...`);

    try {
        // 1. Get User
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            console.error('❌ User not found');
            return;
        }

        // 2. Get 3 challenges
        const allChallenges = await db.query.challenges.findMany({
            limit: 3,
        });

        if (allChallenges.length < 3) {
            console.error('❌ Not enough challenges in DB');
            return;
        }

        const today = new Date();
        const dates = [
            new Date(new Date().setDate(today.getDate() - 1)), // Yesterday
            new Date(new Date().setDate(today.getDate() - 2)), // 2 days ago
        ];

        for (let i = 0; i < dates.length; i++) {
            const challenge = allChallenges[i];
            const date = dates[i];

            console.log(`📝 Setting completion for ${challenge.slug} on ${date.toISOString().split('T')[0]}`);

            const existing = await db.query.progress.findFirst({
                where: and(
                    eq(progress.userId, user.id),
                    eq(progress.challengeId, challenge.id)
                )
            });

            if (existing) {
                await db.update(progress).set({
                    isCompleted: true,
                    completedAt: date,
                    updatedAt: new Date()
                }).where(eq(progress.id, existing.id));
            } else {
                await db.insert(progress).values({
                    userId: user.id,
                    challengeId: challenge.id,
                    isCompleted: true,
                    completedAt: date,
                    attempts: 1,
                    lastAccessedAt: new Date()
                });
            }
        }

        console.log('✅ Streak setup complete! Now complete ONE MORE challenge today to trigger the 3-day streak achievement.');
    } catch (error) {
        console.error('❌ Setup Failed:', error);
    }
}

setupStreak().then(() => process.exit(0));
