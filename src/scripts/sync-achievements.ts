import { db } from '../db';
import { achievements } from '../db/schema';
import { ACHIEVEMENTS } from '../lib/achievements';
import { eq } from 'drizzle-orm';

const ID_TRANSLATIONS: Record<string, { name: string; description: string }> = {
    'first-challenge': {
        name: 'Langkah Pertama',
        description: 'Selesaikan tantangan pertamamu',
    },
    'challenge-10': {
        name: 'Mulai Pemanasan',
        description: 'Selesaikan 10 tantangan',
    },
    'challenge-25': {
        name: 'Tantangan Diterima',
        description: 'Selesaikan 25 tantangan',
    },
    'challenge-50': {
        name: 'Pahlawan Setengah Jalan',
        description: 'Selesaikan 50 tantangan',
    },
    'challenge-100': {
        name: 'Centurion',
        description: 'Selesaikan 100 tantangan',
    },
    'streak-3': {
        name: 'Mulai Membara',
        description: 'Pertahankan streak selama 3 hari',
    },
    'streak-7': {
        name: 'Pejuang Mingguan',
        description: 'Pertahankan streak selama 7 hari',
    },
    'streak-14': {
        name: 'Juara Dua Minggu',
        description: 'Pertahankan streak selama 14 hari',
    },
    'streak-30': {
        name: 'Master Bulanan',
        description: 'Pertahankan streak selama 30 hari',
    },
    'xp-100': {
        name: 'Pemula XP',
        description: 'Dapatkan 100 XP',
    },
    'xp-500': {
        name: 'Pemburu XP',
        description: 'Dapatkan 500 XP',
    },
    'xp-1000': {
        name: 'Kolektor XP',
        description: 'Dapatkan 1.000 XP',
    },
    'xp-2500': {
        name: 'Master XP',
        description: 'Dapatkan 2.500 XP',
    },
    'xp-5000': {
        name: 'Legenda XP',
        description: 'Dapatkan 5.000 XP',
    },
    'daily-5': {
        name: 'Pemanasan',
        description: 'Selesaikan 5 tantangan dalam satu hari',
    },
    'daily-10': {
        name: 'Semangat Membara',
        description: 'Selesaikan 10 tantangan dalam satu hari',
    },
    'daily-15': {
        name: 'Tak Terhentikan',
        description: 'Selesaikan 15 tantangan dalam satu hari',
    },
    'daily-20': {
        name: 'Pelari Maraton',
        description: 'Selesaikan 20 tantangan dalam satu hari',
    },
    'first-tutorial': {
        name: 'Pembelajar Antusias',
        description: 'Selesaikan tutorial pertamamu',
    },
    'bug-squasher': {
        name: 'Pembasmi Bug',
        description: 'Laporkan bug pertamamu yang valid',
    },
};

async function syncAchievements() {
    console.log('🔄 Starting achievement sync...');

    try {
        let updatedCount = 0;
        let createdCount = 0;

        for (const achievement of ACHIEVEMENTS) {
            const translation = ID_TRANSLATIONS[achievement.id];

            // Map criteria type to requirement type for the DB metadata
            let requirementType = 'challenge_count';
            if (achievement.criteria.type === 'xp') requirementType = 'xp_total';
            else if (achievement.criteria.type === 'streak') requirementType = 'streak_days';
            else if (achievement.criteria.type === 'level') requirementType = 'level_reached';
            else if (achievement.category === 'TUTORIALS') requirementType = 'tutorial_count';
            else if (achievement.id === 'bug-squasher') requirementType = 'bug_report_count';
            else if (achievement.criteria.type === 'daily') requirementType = 'daily_count';

            const data = {
                slug: achievement.id,
                name: {
                    en: achievement.name,
                    id: translation ? translation.name : achievement.name,
                },
                description: {
                    en: achievement.description,
                    id: translation ? translation.description : achievement.description,
                },
                icon: achievement.icon,
                rarity:
                    achievement.xpReward >= 500
                        ? 'EPIC'
                        : achievement.xpReward >= 200
                            ? 'RARE'
                            : 'COMMON',
                category: achievement.category.toLowerCase(),
                requirementType,
                requirementValue: achievement.criteria.target,
                xpReward: achievement.xpReward,
                isSecret: achievement.secret || false,
            };

            const existing = await db.query.achievements.findFirst({
                where: eq(achievements.slug, achievement.id),
            });

            if (existing) {
                await db
                    .update(achievements)
                    .set(data)
                    .where(eq(achievements.id, existing.id));
                updatedCount++;
            } else {
                await db.insert(achievements).values(data);
                createdCount++;
            }
        }

        console.log(`✅ Achievement Sync Complete.`);
        console.log(`   - Created: ${createdCount}`);
        console.log(`   - Updated: ${updatedCount}`);
    } catch (error) {
        console.error('❌ Sync Failed:', error);
        process.exit(1);
    }
}

// Run the sync
if (import.meta.main) {
    syncAchievements()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
